<?php

namespace App\Services;

use App\Interfaces\CategoryRepositoryInterface;
use App\Interfaces\CategoryServiceInterface;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryService implements CategoryServiceInterface
{
    protected $categoryRepository;

    public function __construct(CategoryRepositoryInterface $categoryRepository)
    {
        $this->categoryRepository = $categoryRepository;
    }

    public function getAllCategories()
    {
        return $this->categoryRepository->all();
    }

    public function getActiveCategories()
    {
        return $this->categoryRepository->getActive();
    }

    public function getCategoryBySlug(string $slug)
    {
        return $this->categoryRepository->findBySlug($slug);
    }

    public function getCategoryById(string $id)
    {
        return $this->categoryRepository->findById($id);
    }

    public function createCategory(array $data)
    {
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        if (isset($data['image']) && $data['image']->isValid()) {
            $path = $data['image']->store('categories', 'public');
            $data['image_url'] = Storage::url($path);
        }

        return $this->categoryRepository->create($data);
    }

    public function updateCategory(string $id, array $data)
    {
        if (isset($data['name'])) {
            $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        }

        if (isset($data['image']) && $data['image']->isValid()) {
            // Delete old image if it exists
            $category = $this->categoryRepository->findById($id);
            if ($category->image_url) {
                $oldPath = str_replace('/storage/', '', $category->image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $data['image']->store('categories', 'public');
            $data['image_url'] = Storage::url($path);
        }

        return $this->categoryRepository->update($id, $data);
    }

    public function deleteCategory(string $id)
    {
        $category = $this->categoryRepository->findById($id);

        if ($category->image_url) {
            $oldPath = str_replace('/storage/', '', $category->image_url);
            Storage::disk('public')->delete($oldPath);
        }

        return $this->categoryRepository->delete($id);
    }
}
