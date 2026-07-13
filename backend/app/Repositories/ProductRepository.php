<?php

namespace App\Repositories;

use App\Interfaces\ProductRepositoryInterface;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Tag;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductRepository implements ProductRepositoryInterface
{
    public function all(array $filters = [])
    {
        $query = Product::with(['categories', 'tags', 'variants.color', 'variants.size', 'variants.discounts', 'images', 'brand', 'color', 'size', 'discounts'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews');

        if (isset($filters['category_slug'])) {
            $query->whereHas('categories', function ($q) use ($filters) {
                $q->where('slug', $filters['category_slug']);
            });
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (isset($filters['active'])) {
            $query->where('is_active', filter_var($filters['active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['offer_id'])) {
            $query->whereHas('offers', function ($q) use ($filters) {
                $q->where('offers.id', $filters['offer_id']);
            });
        }

        return $query->get();
    }

    public function findBySlug(string $slug)
    {
        return $this->resolve($slug);
    }

    public function findById(string $id)
    {
        return $this->resolve($id);
    }

    public function resolve(string $identifier, array $filters = [])
    {
        $query = Product::with(['categories', 'tags', 'variants.color', 'variants.size', 'variants.discounts', 'images', 'brand', 'color', 'size', 'discounts'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews');

        if (isset($filters['active'])) {
            $query->where(
                'is_active',
                filter_var($filters['active'], FILTER_VALIDATE_BOOLEAN)
            );
        }

        if ($this->isUuid($identifier)) {
            return $query->where('id', $identifier)->firstOrFail();
        }

        $decoded = urldecode($identifier);

        return $query->where(function ($q) use ($decoded) {
            $q->where('slug', $decoded)
                ->orWhere('slug', strtolower($decoded));
        })->firstOrFail();
    }

    protected function isUuid(string $value): bool
    {
        return (bool) preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $value
        );
    }

    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            $product = Product::create([
                'name' => $data['name'],
                'slug' => $data['slug'] ?? Str::slug($data['name']),
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'is_popular' => $data['is_popular'] ?? false,
                'is_top_selling' => $data['is_top_selling'] ?? false,
                'is_trending' => $data['is_trending'] ?? false,
                'brand_id' => $data['brand_id'] ?? null,
                'color_id' => $data['color_id'] ?? null,
                'size_id' => $data['size_id'] ?? null,
                'weight' => $data['weight'] ?? null,
                'long_description' => $data['long_description'] ?? null,
                'additional_info' => $data['additional_info'] ?? null,
            ]);

            // Sync categories
            if (isset($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
            }

            // Sync tags
            if (isset($data['tag_ids'])) {
                $product->tags()->sync($data['tag_ids']);
            }

            // Create product discount
            if ($this->hasDiscountDefinition($data['discount'] ?? null)) {
                $product->discounts()->create($this->discountAttributes($data['discount']));
            }

            // Create variants
            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $variant) {
                    $variantImageUrl = $variant['image_url'] ?? null;
                    if (isset($variant['image']) && $variant['image'] instanceof \Illuminate\Http\UploadedFile && $variant['image']->isValid()) {
                        $path = $variant['image']->store('variants', 'public');
                        $variantImageUrl = \Illuminate\Support\Facades\Storage::url($path);
                    }

                    $newVariant = $product->variants()->create([
                        'variant_name' => $variant['variant_name'],
                        'sku' => $variant['sku'],
                        'retail_price' => $variant['retail_price'],
                        'wholesale_price' => $variant['wholesale_price'],
                        'international_price' => $variant['international_price'] ?? null,
                        'international_wholesale_price' => $variant['international_wholesale_price'] ?? null,
                        'moq' => $variant['moq'] ?? 1,
                        'stock' => $variant['stock'] ?? 0,
                        'weight' => $variant['weight'] ?? $data['weight'] ?? null,
                        'color_id' => $variant['color_id'] ?? $data['color_id'] ?? null,
                        'size_id' => $variant['size_id'] ?? $data['size_id'] ?? null,
                        'is_active' => $variant['is_active'] ?? true,
                        'image_url' => $variantImageUrl,
                    ]);

                    if ($this->hasDiscountDefinition($variant['discount'] ?? null)) {
                        $newVariant->discounts()->create(array_merge(
                            ['product_id' => $product->id],
                            $this->discountAttributes($variant['discount'])
                        ));
                    }
                }
            }

            return $product->load(['categories', 'tags', 'variants.color', 'variants.size', 'variants.discounts', 'images', 'brand', 'color', 'size', 'discounts']);
        });
    }

    public function update(string $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $product = Product::findOrFail($id);

            $product->update([
                'name' => $data['name'] ?? $product->name,
                'slug' => $data['slug'] ?? ($data['name'] ? Str::slug($data['name']) : $product->slug),
                'description' => $data['description'] ?? $product->description,
                'is_active' => $data['is_active'] ?? $product->is_active,
                'is_popular' => $data['is_popular'] ?? $product->is_popular,
                'is_top_selling' => $data['is_top_selling'] ?? $product->is_top_selling,
                'is_trending' => $data['is_trending'] ?? $product->is_trending,
                'brand_id' => array_key_exists('brand_id', $data) ? $data['brand_id'] : $product->brand_id,
                'color_id' => array_key_exists('color_id', $data) ? $data['color_id'] : $product->color_id,
                'size_id' => array_key_exists('size_id', $data) ? $data['size_id'] : $product->size_id,
                'weight' => array_key_exists('weight', $data) ? $data['weight'] : $product->weight,
                'long_description' => array_key_exists('long_description', $data) ? $data['long_description'] : $product->long_description,
                'additional_info' => array_key_exists('additional_info', $data) ? $data['additional_info'] : $product->additional_info,
            ]);

            if (isset($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
            }

            if (isset($data['tag_ids'])) {
                $product->tags()->sync($data['tag_ids']);
            }

            // Update product discount
            if (array_key_exists('discount', $data)) {
                $product->discounts()->whereNull('variant_id')->delete();
                if ($this->hasDiscountDefinition($data['discount'])) {
                    $product->discounts()->create($this->discountAttributes($data['discount']));
                }
            }

            // Sync variants
            if (isset($data['variants']) && is_array($data['variants'])) {
                $incomingVariantIds = [];

                foreach ($data['variants'] as $variantData) {
                    $variantImageUrl = $variantData['image_url'] ?? null;
                    if (isset($variantData['image']) && $variantData['image'] instanceof \Illuminate\Http\UploadedFile && $variantData['image']->isValid()) {
                        $path = $variantData['image']->store('variants', 'public');
                        $variantImageUrl = \Illuminate\Support\Facades\Storage::url($path);
                    }

                    $variantModel = null;
                    if (isset($variantData['id'])) {
                        // Update existing variant
                        $variant = ProductVariant::where('product_id', $product->id)->findOrFail($variantData['id']);

                        // If new image uploaded, delete old one from storage
                        if (isset($variantData['image']) && $variant->image_url) {
                            $oldPath = str_replace('/storage/', '', $variant->image_url);
                            \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
                        }

                        $variant->update(array_merge($variantData, [
                            'image_url' => $variantImageUrl ?? $variant->image_url,
                        ]));
                        $incomingVariantIds[] = $variant->id;
                        $variantModel = $variant;
                    } else {
                        // Create new variant
                        $newVariant = $product->variants()->create([
                            'variant_name' => $variantData['variant_name'],
                            'sku' => $variantData['sku'],
                            'retail_price' => $variantData['retail_price'],
                            'wholesale_price' => $variantData['wholesale_price'],
                            'international_price' => $variantData['international_price'] ?? null,
                            'international_wholesale_price' => $variantData['international_wholesale_price'] ?? null,
                            'moq' => $variantData['moq'] ?? 1,
                            'stock' => $variantData['stock'] ?? 0,
                            'weight' => $variantData['weight'] ?? $data['weight'] ?? $product->weight,
                            'color_id' => $variantData['color_id'] ?? $data['color_id'] ?? $product->color_id,
                            'size_id' => $variantData['size_id'] ?? $data['size_id'] ?? $product->size_id,
                            'is_active' => $variantData['is_active'] ?? true,
                            'image_url' => $variantImageUrl,
                        ]);
                        $incomingVariantIds[] = $newVariant->id;
                        $variantModel = $newVariant;
                    }

                    if (array_key_exists('discount', $variantData)) {
                        $variantModel->discounts()->delete();
                        if ($this->hasDiscountDefinition($variantData['discount'])) {
                            $variantModel->discounts()->create(array_merge(
                                ['product_id' => $product->id],
                                $this->discountAttributes($variantData['discount'])
                            ));
                        }
                    }
                }

                // Optionally delete variants not present in the update payload
                if (filter_var($data['sync_variants'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    $product->variants()->whereNotIn('id', $incomingVariantIds)->delete();
                }
            }

            return $product->load(['categories', 'tags', 'variants.color', 'variants.size', 'variants.discounts', 'images', 'brand', 'color', 'size', 'discounts']);
        });
    }

    public function delete(string $id)
    {
        $product = Product::findOrFail($id);
        return $product->delete();
    }

    public function addImage(string $productId, array $imageData)
    {
        $product = Product::findOrFail($productId);
        return $product->images()->create($imageData);
    }

    public function removeImage(string $imageId)
    {
        $image = ProductImage::findOrFail($imageId);
        return $image->delete();
    }

    private function hasDiscountDefinition($discount): bool
    {
        if (!is_array($discount)) {
            return false;
        }

        $pairs = [
            'type' => 'value',
            'international_type' => 'international_value',
            'wholesale_type' => 'wholesale_value',
            'wholesale_international_type' => 'wholesale_international_value',
        ];

        foreach ($pairs as $typeKey => $valueKey) {
            if (
                !empty($discount[$typeKey])
                && array_key_exists($valueKey, $discount)
                && $discount[$valueKey] !== null
                && $discount[$valueKey] !== ''
            ) {
                return true;
            }
        }

        return false;
    }

    private function discountAttributes(array $discount): array
    {
        return [
            'type' => $discount['type'] ?? null,
            'value' => $discount['value'] ?? null,
            'international_type' => $discount['international_type'] ?? null,
            'international_value' => $discount['international_value'] ?? null,
            'wholesale_type' => $discount['wholesale_type'] ?? null,
            'wholesale_value' => $discount['wholesale_value'] ?? null,
            'wholesale_international_type' => $discount['wholesale_international_type'] ?? null,
            'wholesale_international_value' => $discount['wholesale_international_value'] ?? null,
            'starts_at' => $discount['starts_at'],
            'ends_at' => $discount['ends_at'],
            'is_active' => filter_var($discount['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
