<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Discount;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class RefreshDailyDeals extends Command
{
    protected $signature = 'app:refresh-daily-deals';
    protected $description = 'Select and cache the top deals of the day (products/variants with active discounts, by highest % off)';

    public function handle()
    {
        $this->info('Selecting daily deals...');

        $now = now();

        /*
         * Strategy:
         * 1. Find all active discounts valid right now (starts_at <= now <= ends_at).
         * 2. Order by discount value DESC (highest % / flat off first).
         * 3. Collect up to 30 unique products.
         * 4. Shuffle the top N to avoid showing identical products every day.
         * 5. Cache for 24 hours.
         */

        // Step 1 – active discounts today
        $activeDiscounts = Discount::with([
            'product.images',
            'product.brand',
            'product.variants.discounts',
            'product.variants',
            'product.discounts',
            'variant',
        ])
            ->where('is_active', true)
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now)
            ->orderByDesc('value')
            ->get();

        if ($activeDiscounts->isEmpty()) {
            // Fallback: top products by discount_percentage
            $this->warn('No active time-bound discounts found. Falling back to product discount_percentage.');

            $products = Product::with(['images', 'brand', 'variants', 'variants.discounts', 'discounts'])
                ->where('is_active', true)
                ->where('discount_percentage', '>', 0)
                ->orderByDesc('discount_percentage')
                ->orderByDesc('sales_count')
                ->limit(30)
                ->get()
                ->shuffle()
                ->values();

            Cache::put('daily_deals', $products, $now->addHours(24));
            $this->info('Cached ' . $products->count() . ' fallback deals.');
            return;
        }

        // Step 2 – build a flat list of "deal entries" keyed by product id (no duplicates)
        $seen = [];
        $deals = [];

        foreach ($activeDiscounts as $discount) {
            $product = $discount->product;
            if (!$product || !$product->is_active) continue;

            $productId = $product->id;
            if (isset($seen[$productId])) continue; 
            $seen[$productId] = true;

            $dealVariantImageUrl = null;
            if ($discount->variant_id && $discount->variant) {
                $dealVariantImageUrl = $discount->variant->image_url;
            }

            $product->deal_discount_id      = $discount->id;
            $product->deal_discount_type    = $discount->type;
            $product->deal_discount_value   = $discount->value;
            $product->deal_starts_at        = $discount->starts_at;
            $product->deal_ends_at          = $discount->ends_at;
            $product->deal_variant_id       = $discount->variant_id;
            $product->deal_variant_image    = $dealVariantImageUrl;

            $deals[] = $product;

            if (count($deals) >= 30) break;
        }

        // Fill up to at least 12 deals using fallbacks
        if (count($deals) < 12) {
            $needed = 12 - count($deals);
            
            // Fallback 1: Products with discount_percentage > 0
            $additional = Product::with(['images', 'brand', 'variants', 'variants.discounts', 'discounts'])
                ->where('is_active', true)
                ->where('discount_percentage', '>', 0)
                ->whereNotIn('id', array_keys($seen))
                ->orderByDesc('discount_percentage')
                ->limit($needed)
                ->get();
            
            foreach ($additional as $p) {
                $deals[] = $p;
                $seen[$p->id] = true;
            }

            // Fallback 2: Featured products if still not enough
            if (count($deals) < 12) {
                $needed = 12 - count($deals);
                $featured = Product::with(['images', 'brand', 'variants', 'variants.discounts', 'discounts'])
                    ->where('is_active', true)
                    ->where('is_featured', true)
                    ->whereNotIn('id', array_keys($seen))
                    ->limit($needed)
                    ->get();
                
                foreach ($featured as $p) {
                    $deals[] = $p;
                    $seen[$p->id] = true;
                }
            }

            // Fallback 3: Top selling products if still not enough
            if (count($deals) < 12) {
                $needed = 12 - count($deals);
                $popular = Product::with(['images', 'brand', 'variants', 'variants.discounts', 'discounts'])
                    ->where('is_active', true)
                    ->whereNotIn('id', array_keys($seen))
                    ->orderByDesc('sales_count')
                    ->limit($needed)
                    ->get();
                
                foreach ($popular as $p) {
                    $deals[] = $p;
                    $seen[$p->id] = true;
                }
            }
        }

        if (empty($deals)) {
            $this->warn('No valid deal products found.');
            return;
        }

        // Step 3 – shuffle top half so repeat-daily feel is avoided
        $topHalf  = array_slice($deals, 0, (int) ceil(count($deals) / 2));
        $rest     = array_slice($deals, (int) ceil(count($deals) / 2));
        shuffle($topHalf);
        $shuffled = array_merge($topHalf, $rest);

        Cache::put('daily_deals', $shuffled, $now->addHours(24));

        $this->info('Successfully cached ' . count($shuffled) . ' deals for the next 24 hours.');
    }
}
