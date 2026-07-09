<?php

namespace App\Http\Requests\Api\Coupon;

use App\Models\Coupon;
use Illuminate\Foundation\Http\FormRequest;

class ValidateCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|max:' . Coupon::SECURE_CODE_LENGTH,
            'subtotal' => 'required|numeric|min:0',
            'shipping_address' => 'required|array',
            'items' => 'nullable|array',
            'items.*.product_id' => 'nullable|uuid',
            'items.*.brand_id' => 'nullable|uuid',
            'items.*.category_ids' => 'nullable|array',
            'items.*.category_ids.*' => 'uuid',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.line_total' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:64',
        ];
    }
}
