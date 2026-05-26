<?php

namespace App\Repositories;

use App\Interfaces\CategoryRepositoryInterface;
use App\Models\Category;

class CategoryRepository implements CategoryRepositoryInterface
{
    public function all()
    {
        return Category::with('parent')->withCount('products')->get();
    }

    public function getActive()
    {
        return Category::with('parent')->withCount('products')->get();
    }

    public function findBySlug(string $slug)
    {
        return Category::with(['parent', 'products'])->where('slug', $slug)->firstOrFail();
    }

    public function findById(string $id)
    {
        return Category::findOrFail($id);
    }

    public function create(array $data)
    {
        return Category::create($data);
    }

    public function update(string $id, array $data)
    {
        $category = $this->findById($id);
        $category->update($data);
        return $category;
    }

    public function delete(string $id)
    {
        $category = $this->findById($id);
        return $category->delete();
    }
}
