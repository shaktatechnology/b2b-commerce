<?php

namespace App\Interfaces;

interface ProductServiceInterface
{
    public function getAllProducts(array $filters = []);
    public function getProductBySlug(string $slug);
    public function getProductById(string $id);
    public function createProduct(array $data);
    public function updateProduct(string $id, array $data);
    public function deleteProduct(string $id);
    public function uploadProductImage(string $productId, $imageFile, bool $isPrimary = false, int $sortOrder = 0);
    public function deleteProductImage(string $imageId);
    public function deleteProductImages(string $productId);
}

