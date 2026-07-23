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

    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        $now = now();
        $user = $request->user('sanctum') ?: $request->user();

        $coupons = \App\Models\Coupon::with(['regionRules', 'products', 'categories', 'brands'])
            ->withCount('redemptions')
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

        if ($user) {
            $coupons->transform(function ($coupon) use ($user) {
                $coupon->user_redemptions_count = $coupon->redemptions()->where('user_id', $user->id)->count();
                return $coupon;
            });
        }

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
