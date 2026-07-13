<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Coupon\GenerateCouponCodeRequest;
use App\Http\Requests\Api\Coupon\StoreCouponRequest;
use App\Http\Requests\Api\Coupon\UpdateCouponRequest;
use App\Interfaces\Coupon\CouponServiceInterface;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function __construct(protected CouponServiceInterface $couponService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $coupons = $this->couponService->all($request->only(['status', 'search', 'per_page']));

        return response()->json([
            'message' => 'Coupons retrieved successfully',
            'data' => $coupons,
        ]);
    }

    public function store(StoreCouponRequest $request): JsonResponse
    {
        $coupon = $this->couponService->createCoupon($request->validated(), $request->user());

        return response()->json([
            'message' => 'Coupon created successfully',
            'data' => $coupon->load(['creator', 'regionRules', 'products', 'categories', 'brands', 'users']),
            'secure_code' => $coupon->secure_code,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $coupon = $this->couponService->findById($id);

        abort_if(!$coupon, 404, 'Coupon not found.');

        return response()->json([
            'message' => 'Coupon retrieved successfully',
            'data' => $coupon,
        ]);
    }

    public function update(UpdateCouponRequest $request, string $id): JsonResponse
    {
        $coupon = $this->couponService->updateCoupon($id, $request->validated());

        return response()->json([
            'message' => 'Coupon updated successfully',
            'data' => $coupon,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->couponService->deleteCoupon($id);

        return response()->json([
            'message' => 'Coupon deleted successfully',
        ]);
    }

    public function status(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $coupon = $this->couponService->toggleStatus($id, $data['status']);

        return response()->json([
            'message' => 'Coupon status updated successfully',
            'data' => $coupon,
        ]);
    }

    public function generateCode(GenerateCouponCodeRequest $request): JsonResponse
    {
        $code = $this->couponService->generateCustomerCode((int) $request->input('length', Coupon::CUSTOMER_CODE_LENGTH));

        return response()->json([
            'message' => 'Coupon code generated successfully',
            'data' => [
                'coupon_code' => $code,
            ],
        ]);
    }

    public function redemptions(string $id): JsonResponse
    {
        $redemptions = $this->couponService->getRedemptions($id);

        return response()->json([
            'message' => 'Coupon redemptions retrieved successfully',
            'data' => $redemptions,
        ]);
    }
}
