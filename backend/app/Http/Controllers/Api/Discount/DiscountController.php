<?php

namespace App\Http\Controllers\Api\Discount;

use App\Http\Controllers\Controller;
use App\Interfaces\Discount\DiscountServiceInterface;
use App\Http\Requests\Api\Discount\CreateDiscountRequest;
use App\Http\Requests\Api\Discount\UpdateDiscountRequest;
use Illuminate\Http\Request;

class DiscountController extends Controller
{
    protected $discountService;

    public function __construct(DiscountServiceInterface $discountService)
    {
        $this->discountService = $discountService;
    }

    /**
     * Display a listing of discounts.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['product_id', 'variant_id', 'active']);

        // Non-admin can only view active discounts
        if (!$request->user() || $request->user()->role !== 'admin') {
            $filters['active'] = true;
        }

        $discounts = $this->discountService->getAllDiscounts($filters);

        return response()->json([
            'data' => $discounts
        ]);
    }

    /**
     * Display the specified discount.
     */
    public function show(Request $request, string $id)
    {
        $discount = $this->discountService->getDiscountById($id);

        // Non-admin can only view active discounts
        if (!$request->user() || $request->user()->role !== 'admin') {
            $now = now();
            $isActive = $discount->is_active &&
                $discount->starts_at <= $now &&
                $discount->ends_at >= $now;

            if (!$isActive) {
                return response()->json(['message' => 'Discount not found or inactive.'], 404);
            }
        }

        return response()->json([
            'data' => $discount
        ]);
    }

    /**
     * Store a newly created discount.
     */
    public function store(CreateDiscountRequest $request)
    {
        $discount = $this->discountService->createDiscount($request->validated());

        return response()->json([
            'message' => 'Discount created successfully',
            'data' => $discount
        ], 201);
    }

    /**
     * Update the specified discount.
     */
    public function update(UpdateDiscountRequest $request, string $id)
    {
        $discount = $this->discountService->updateDiscount($id, $request->validated());

        return response()->json([
            'message' => 'Discount updated successfully',
            'data' => $discount
        ]);
    }

    /**
     * Remove the specified discount.
     */
    public function destroy(Request $request, string $id)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized: Admin access required.'], 403);
        }

        $this->discountService->deleteDiscount($id);

        return response()->json([
            'message' => 'Discount deleted successfully'
        ]);
    }
}
