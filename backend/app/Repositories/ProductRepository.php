<?php

namespace App\Repositories;

use App\Interfaces\ProductRepositoryInterface;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductRepository implements ProductRepositoryInterface
{
    public function all(array $filters = [])
    {
        $query = Product::with(['categories', 'variants.color', 'variants.size', 'variants.discounts', 'images', 'brand', 'color', 'size', 'discounts'])
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
        $query = Product::with(['categories', 'variants.color', 'variants.size', 'variants.discounts', 'images', 'brand', 'color', 'size', 'discounts'])
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

            // Sync categories (Many-to-Many)
            if (isset($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
            }

            // Create product discount
            if (isset($data['discount']) && is_array($data['discount']) && isset($data['discount']['type'])) {
                $product->discounts()->create([
                    'type' => $data['discount']['type'],
                    'value' => $data['discount']['value'],
                    'starts_at' => $data['discount']['starts_at'],
                    'ends_at' => $data['discount']['ends_at'],
                    'is_active' => filter_var($data['discount']['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ]);
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
                        'moq' => $variant['moq'] ?? 1,
                        'stock' => $variant['stock'] ?? 0,
                        'weight' => $variant['weight'] ?? $data['weight'] ?? null,
                        'color_id' => $variant['color_id'] ?? $data['color_id'] ?? null,
                        'size_id' => $variant['size_id'] ?? $data['size_id'] ?? null,
                        'is_active' => $variant['is_active'] ?? true,
                        'image_url' => $variantImageUrl,
                    ]);

                    if (isset($variant['discount']) && is_array($variant['discount']) && isset($variant['discount']['type'])) {
                        $newVariant->discounts()->create([
                            'product_id' => $product->id,
                            'type' => $variant['discount']['type'],
                            'value' => $variant['discount']['value'],
                            'starts_at' => $variant['discount']['starts_at'],
                            'ends_at' => $variant['discount']['ends_at'],
                            'is_active' => filter_var($variant['discount']['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                        ]);
                    }
                }
            }

            return $product->load(['categories', 'variants.color', 'variants.size', 'variants.discounts', 'images', 'brand', 'color', 'size', 'discounts']);
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

            // Update product discount
            if (array_key_exists('discount', $data)) {
                $product->discounts()->whereNull('variant_id')->delete();
                if (is_array($data['discount']) && isset($data['discount']['type'])) {
                    $product->discounts()->create([
                        'type' => $data['discount']['type'],
                        'value' => $data['discount']['value'],
                        'starts_at' => $data['discount']['starts_at'],
                        'ends_at' => $data['discount']['ends_at'],
                        'is_active' => filter_var($data['discount']['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    ]);
                }
            }

            // Sync variants (create new ones, update existing, or delete omitted)
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
                        if (is_array($variantData['discount']) && isset($variantData['discount']['type'])) {
                            $variantModel->discounts()->create([
                                'product_id' => $product->id,
                                'type' => $variantData['discount']['type'],
                                'value' => $variantData['discount']['value'],
                                'starts_at' => $variantData['discount']['starts_at'],
                                'ends_at' => $variantData['discount']['ends_at'],
                                'is_active' => filter_var($variantData['discount']['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                            ]);
                        }
                    }
                }

                // Optionally delete variants not present in the update payload
                if (filter_var($data['sync_variants'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    $product->variants()->whereNotIn('id', $incomingVariantIds)->delete();
                }
            }

            return $product->load(['categories', 'variants.color', 'variants.size', 'variants.discounts', 'images', 'brand', 'color', 'size', 'discounts']);
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
}
