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
        $filters = $request->only(['category_slug', 'search', 'active', 'offer_id']);
        
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
     * Get cached daily deals (top 3 shown on homepage).
     */
    public function dailyDeals()
    {
        $deals = \Illuminate\Support\Facades\Cache::get('daily_deals', []);

        return response()->json([
            'data' => $deals
        ]);
    }

    /**
     * Get live deals — products/variants with active discounts today.
     * Used by the "View All" deals page. Always fresh, up to 20.
     */
    public function dailyDealsAll()
    {
        $now = now();

        // Get active discounts valid today
        $activeDiscounts = \App\Models\Discount::with([
            'product.images',
            'product.brand',
            'product.variants',
            'product.variants.discounts',
            'product.discounts',
            'variant',
        ])
            ->where('is_active', true)
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now)
            ->whereHas('product.variants', function ($q) {
                $q->where('stock', '>', 0)->where('is_active', true);
            })
            ->orderByDesc('value')
            ->get();

        $seen = [];
        $deals = [];

        foreach ($activeDiscounts as $discount) {
            $product = $discount->product;
            if (!$product || !$product->is_active) continue;

            $productId = $product->id;
            if (isset($seen[$productId])) continue;
            $seen[$productId] = true;

            $dealVariantImageUrl = null;
            if ($discount->variant_id && $discount->variant) {
                $dealVariantImageUrl = $discount->variant->image_url;
            }

            $product->deal_discount_value = $discount->value;
            $product->deal_discount_type  = $discount->type;
            $product->deal_variant_image  = $dealVariantImageUrl;
            $product->deal_variant_id     = $discount->variant_id;

            $deals[] = $product;

            if (count($deals) >= 20) break;
        }

        // Fill up to 20 if we have fewer
        if (count($deals) < 20) {
            $needed = 20 - count($deals);
            $additional = \App\Models\Product::with(['images', 'brand', 'variants', 'variants.discounts', 'discounts'])
                ->where('is_active', true)
                ->where('discount_percentage', '>', 0)
                ->whereNotIn('id', array_keys($seen))
                ->orderByDesc('discount_percentage')
                ->limit($needed)
                ->get();
            
            foreach ($additional as $p) {
                $deals[] = $p;
                $seen[$p->id] = true;
            }

            // Fallback: Featured
            if (count($deals) < 20) {
                $needed = 20 - count($deals);
                $featured = \App\Models\Product::with(['images', 'brand', 'variants', 'variants.discounts', 'discounts'])
                    ->where('is_active', true)
                    ->where('is_featured', true)
                    ->whereNotIn('id', array_keys($seen))
                    ->limit($needed)
                    ->get();
                foreach($featured as $p) {
                    $deals[] = $p;
                    $seen[$p->id] = true;
                }
            }

            // Fallback: Popular
            if (count($deals) < 20) {
                $needed = 20 - count($deals);
                $popular = \App\Models\Product::with(['images', 'brand', 'variants', 'variants.discounts', 'discounts'])
                    ->where('is_active', true)
                    ->whereNotIn('id', array_keys($seen))
                    ->orderByDesc('sales_count')
                    ->limit($needed)
                    ->get();
                foreach($popular as $p) {
                    $deals[] = $p;
                    $seen[$p->id] = true;
                }
            }
        }

        // Shuffle so it's not the same ones in the same order every time
        shuffle($deals);

        return response()->json([
            'data' => $deals
        ]);
    }

    /**
     * Display the specified product by slug.
     */
    public function show(Request $request, string $slug)
    {
        $filters = [];
        if (!$request->user() || $request->user()->role !== 'admin') {
            $filters['active'] = true;
        }

        $product = $this->productService->resolveProduct($slug, $filters);

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
