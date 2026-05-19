<?php

namespace App\Interfaces;

interface ProductRepositoryInterface
{
    public function all(array $filters = []);
    public function findBySlug(string $slug);
    public function findById(string $id);
    public function create(array $data);
    public function update(string $id, array $data);
    public function delete(string $id);
    public function addImage(string $productId, array $imageData);
    public function removeImage(string $imageId);
}
