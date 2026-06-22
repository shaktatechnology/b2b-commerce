<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RefreshDailyDeals extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:refresh-daily-deals';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Select and cache the top deals for the day';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Selecting daily deals...');

        // Selection Logic: 
        // We prioritize featured items, then highest discounts, then popularity (sales_count)
        $deals = \App\Models\Product::with(['images', 'brand', 'variants.discounts', 'discounts'])
            ->where('is_active', true)
            ->orderByDesc('discount_percentage')
            ->orderByDesc('is_featured')
            ->orderByDesc('sales_count')
            ->limit(12) // Pre-compute more than needed for flexibility
            ->get();

        if ($deals->isEmpty()) {
            $this->warn('No active products found to set as deals.');
            return;
        }

        // Save to cache for 24 hours
        \Illuminate\Support\Facades\Cache::put('daily_deals', $deals, now()->addHours(24));

        $this->info('Successfully cached ' . $deals->count() . ' deals for the next 24 hours.');
    }
}
