<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Interfaces\CategoryServiceInterface;
use App\Http\Requests\Api\CreateCategoryRequest;
use App\Http\Requests\Api\UpdateCategoryRequest;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    protected $categoryService;

    public function __construct(CategoryServiceInterface $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    /**
     * Display a listing of categories.
     */
    public function index()
    {
        $categories = $this->categoryService->getAllCategories();

        return response()->json([
            'data' => $categories
        ]);
    }

    /**
     * Display the specified category by slug.
     */
    public function show(string $slug)
    {
        $category = $this->categoryService->getCategoryBySlug($slug);

        return response()->json([
            'data' => $category
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(CreateCategoryRequest $request)
    {
        // Category creation supports optional image upload
        $category = $this->categoryService->createCategory(array_merge(
            $request->validated(),
            ['image' => $request->file('image')]
        ));

        return response()->json([
            'message' => 'Category created successfully',
            'data' => $category
        ], 201);
    }

    /**
     * Update the specified category.
     */
    public function update(UpdateCategoryRequest $request, string $id)
    {
        $category = $this->categoryService->updateCategory($id, array_merge(
            $request->validated(),
            ['image' => $request->file('image')]
        ));

        return response()->json([
            'message' => 'Category updated successfully',
            'data' => $category
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Request $request, string $id)
    {
        // Admin authorization check
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required.'], 403);
        }

        $this->categoryService->deleteCategory($id);

        return response()->json([
            'message' => 'Category deleted successfully'
        ]);
    }
}
