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

    public function validate(ValidateCouponRequest $request): JsonResponse
    {
        $result = $this->couponValidationService->validateCoupon($request->validated(), $request->user());

        if (($result['success'] ?? false) && isset($result['data'])) {
            $result['data']['preview'] = true;
        }

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }
}
