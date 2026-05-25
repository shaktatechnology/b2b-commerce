<?php

namespace App\Services;

use App\Interfaces\ProductRepositoryInterface;
use App\Interfaces\ProductServiceInterface;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductService implements ProductServiceInterface
{
    protected $productRepository;

    public function __construct(ProductRepositoryInterface $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    public function getAllProducts(array $filters = [])
    {
        return $this->productRepository->all($filters);
    }

    public function getProductBySlug(string $slug)
    {
        return $this->productRepository->findBySlug($slug);
    }

    public function getProductById(string $id)
    {
        return $this->productRepository->findById($id);
    }

    public function resolveProduct(string $identifier, array $filters = [])
    {
        return $this->productRepository->resolve($identifier, $filters);
    }

    public function createProduct(array $data)
    {
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        return $this->productRepository->create($data);
    }

    public function updateProduct(string $id, array $data)
    {
        if (isset($data['name'])) {
            $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        }
        return $this->productRepository->update($id, $data);
    }

    public function deleteProduct(string $id)
    {
        $product = $this->productRepository->findById($id);

        // Delete associated local images from storage
        foreach ($product->images as $image) {
            $path = str_replace('/storage/', '', $image->url);
            Storage::disk('public')->delete($path);
        }

        return $this->productRepository->delete($id);
    }

    public function uploadProductImage(string $productId, $imageFile, bool $isPrimary = false, int $sortOrder = 0)
    {
        if ($imageFile && $imageFile->isValid()) {
            if ($isPrimary) {
                // Set other images for this product as not primary
                ProductImage::where('product_id', $productId)->update(['is_primary' => false]);
            }

            $path = $imageFile->store('products', 'public');
            $url = Storage::url($path);

            return $this->productRepository->addImage($productId, [
                'url' => $url,
                'is_primary' => $isPrimary,
                'sort_order' => $sortOrder,
            ]);
        }

        throw new \InvalidArgumentException('Invalid image upload.');
    }

    public function deleteProductImage(string $imageId)
    {
        $image = ProductImage::findOrFail($imageId);
        $path = str_replace('/storage/', '', $image->url);
        Storage::disk('public')->delete($path);

        return $this->productRepository->removeImage($imageId);
    }

    public function deleteProductImages(string $productId)
    {
        $product = $this->productRepository->findById($productId);
        foreach ($product->images as $image) {
            $path = str_replace('/storage/', '', $image->url);
            Storage::disk('public')->delete($path);
            $this->productRepository->removeImage($image->id);
        }
        return true;
    }
}
