<?php

namespace App\Http\Requests\Api\Coupon;

use App\Models\Coupon;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCouponRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('customer_code') && $this->input('customer_code') !== null) {
            $this->merge([
                'customer_code' => strtoupper(trim((string) $this->input('customer_code'))),
            ]);
        }
    }

    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        $couponId = $this->route('id');

        return [
            'name' => 'sometimes|required|string|max:' . Coupon::NAME_MAX_LENGTH,
            'customer_code' => 'sometimes|nullable|string|max:' . Coupon::CUSTOMER_CODE_LENGTH . '|unique:coupons,customer_code,' . $couponId,
            'description' => 'sometimes|nullable|string|max:5000',
            'status' => 'sometimes|nullable|in:active,inactive',
            'starts_at' => 'sometimes|nullable|date',
            'expires_at' => 'sometimes|nullable|date|after_or_equal:starts_at',
            'usage_limit' => 'sometimes|nullable|integer|min:1',
            'usage_per_user' => 'sometimes|nullable|integer|min:1',
            'stackable' => 'sometimes|nullable|boolean',
            'first_order_only' => 'sometimes|nullable|boolean',
            'customer_type' => 'sometimes|nullable|string|max:' . Coupon::CUSTOMER_TYPE_MAX_LENGTH,
            'region_rules' => 'sometimes|array|min:1',
            'region_rules.*.market' => 'required_with:region_rules|in:NP,INT',
            'region_rules.*.currency' => 'required_with:region_rules|in:NPR,USD',
            'region_rules.*.discount_type' => 'required_with:region_rules|in:percentage,fixed',
            'region_rules.*.discount_value' => 'required_with:region_rules|numeric|min:0',
            'region_rules.*.minimum_subtotal' => 'nullable|numeric|min:0',
            'region_rules.*.maximum_discount' => 'nullable|numeric|min:0',
            'region_rules.*.free_shipping' => 'nullable|boolean',
            'product_ids' => 'sometimes|nullable|array',
            'product_ids.*' => 'uuid|exists:products,id',
            'category_ids' => 'sometimes|nullable|array',
            'category_ids.*' => 'uuid|exists:categories,id',
            'brand_ids' => 'sometimes|nullable|array',
            'brand_ids.*' => 'uuid|exists:brands,id',
            'user_ids' => 'sometimes|nullable|array',
            'user_ids.*' => 'uuid|exists:users,id',
        ];
    }
}
