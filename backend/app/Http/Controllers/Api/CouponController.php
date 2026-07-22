<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Coupon\ValidateCouponRequest;
use App\Services\Coupon\CouponValidationService;
use Illuminate\Http\JsonResponse;

class CouponController extends Controller
{
    public function __construct(protected CouponValidationService $couponValidationService)
    {
    }

    public function index(): JsonResponse
    {
        $now = now();
        $coupons = \App\Models\Coupon::with(['regionRules', 'products', 'categories', 'brands'])
            ->where('status', 'active')
            ->where(function ($query) use ($now) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', $now);
            })
            ->get();

        return response()->json([
            'data' => $coupons
        ]);
    }

    public function validate(ValidateCouponRequest $request): JsonResponse
    {
        $user = $request->user('sanctum') ?: $request->user();
        $result = $this->couponValidationService->validateCoupon($request->validated(), $user);

        if (($result['success'] ?? false) && isset($result['data'])) {
            $result['data']['preview'] = true;
        }

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }
}
