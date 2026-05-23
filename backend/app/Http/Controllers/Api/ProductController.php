<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Interfaces\ProductServiceInterface;
use App\Http\Requests\Api\CreateProductRequest;
use App\Http\Requests\Api\UpdateProductRequest;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected $productService;

    public function __construct(ProductServiceInterface $productService)
    {
        $this->productService = $productService;
    }

    /**
     * Display a listing of products with filters.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['category_slug', 'search', 'active']);
        
        // Non-admin can only view active products
        if (!$request->user() || $request->user()->role !== 'admin') {
            $filters['active'] = true;
        }

        $products = $this->productService->getAllProducts($filters);

        return response()->json([
            'data' => $products
        ]);
    }

    /**
     * Display the specified product by slug.
     */
    public function show(string $slug)
    {
        $product = $this->productService->getProductBySlug($slug);

        return response()->json([
            'data' => $product
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(CreateProductRequest $request)
    {
        $product = $this->productService->createProduct($request->validated());

        return response()->json([
            'message' => 'Product created successfully',
            'data' => $product
        ], 201);
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductRequest $request, string $id)
    {
        $product = $this->productService->updateProduct($id, $request->validated());

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => $product
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Request $request, string $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required.'], 403);
        }

        $this->productService->deleteProduct($id);

        return response()->json([
            'message' => 'Product deleted successfully'
        ]);
    }

    /**
     * Upload an image for the product.
     */
    public function uploadImage(Request $request, string $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required.'], 403);
        }

        $request->validate([
            'image' => 'required|image|max:5120',
            'is_primary' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $image = $this->productService->uploadProductImage(
            $id,
            $request->file('image'),
            $request->boolean('is_primary', false),
            $request->integer('sort_order', 0)
        );

        return response()->json([
            'message' => 'Product image uploaded successfully',
            'data' => $image
        ], 201);
    }

    /**
     * Remove the specified product image.
     */
    public function deleteImage(Request $request, string $imageId)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required.'], 403);
        }

        $this->productService->deleteProductImage($imageId);

        return response()->json([
            'message' => 'Product image deleted successfully'
        ]);
    }

    /**
     * Remove all images for a product.
     */
    public function deleteProductImages(Request $request, string $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required.'], 403);
        }

        $this->productService->deleteProductImages($id);

        return response()->json([
            'message' => 'Product images cleared successfully'
        ]);
    }
}
