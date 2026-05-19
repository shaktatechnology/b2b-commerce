<?php

namespace App\Interfaces;

interface CategoryServiceInterface
{
    public function getAllCategories();
    public function getActiveCategories();
    public function getCategoryBySlug(string $slug);
    public function getCategoryById(string $id);
    public function createCategory(array $data);
    public function updateCategory(string $id, array $data);
    public function deleteCategory(string $id);
}
