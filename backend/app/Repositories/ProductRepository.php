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
        $query = Product::with(['categories', 'variants', 'images']);

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
        return Product::with(['categories', 'variants', 'images'])->where('slug', $slug)->firstOrFail();
    }

    public function findById(string $id)
    {
        return Product::with(['categories', 'variants', 'images'])->findOrFail($id);
    }

    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            $product = Product::create([
                'name' => $data['name'],
                'slug' => $data['slug'] ?? Str::slug($data['name']),
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Sync categories (Many-to-Many)
            if (isset($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
            }

            // Create variants
            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $variant) {
                    $variantImageUrl = $variant['image_url'] ?? null;
                    if (isset($variant['image']) && $variant['image'] instanceof \Illuminate\Http\UploadedFile && $variant['image']->isValid()) {
                        $path = $variant['image']->store('variants', 'public');
                        $variantImageUrl = \Illuminate\Support\Facades\Storage::url($path);
                    }

                    $product->variants()->create([
                        'variant_name' => $variant['variant_name'],
                        'sku' => $variant['sku'],
                        'retail_price' => $variant['retail_price'],
                        'wholesale_price' => $variant['wholesale_price'],
                        'moq' => $variant['moq'] ?? 1,
                        'stock' => $variant['stock'] ?? 0,
                        'weight' => $variant['weight'] ?? null,
                        'is_active' => $variant['is_active'] ?? true,
                        'image_url' => $variantImageUrl,
                    ]);
                }
            }

            return $product->load(['categories', 'variants', 'images']);
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
            ]);

            if (isset($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
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
                    } else {
                        // Create new variant
                        $newVariant = $product->variants()->create([
                            'variant_name' => $variantData['variant_name'],
                            'sku' => $variantData['sku'],
                            'retail_price' => $variantData['retail_price'],
                            'wholesale_price' => $variantData['wholesale_price'],
                            'moq' => $variantData['moq'] ?? 1,
                            'stock' => $variantData['stock'] ?? 0,
                            'weight' => $variantData['weight'] ?? null,
                            'is_active' => $variantData['is_active'] ?? true,
                            'image_url' => $variantImageUrl,
                        ]);
                        $incomingVariantIds[] = $newVariant->id;
                    }
                }

                // Optionally delete variants not present in the update payload
                if (filter_var($data['sync_variants'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    $product->variants()->whereNotIn('id', $incomingVariantIds)->delete();
                }
            }

            return $product->load(['categories', 'variants', 'images']);
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
