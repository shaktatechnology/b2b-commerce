<?php

namespace App\Http\Requests\Api\Coupon;

use App\Models\Coupon;
use Illuminate\Foundation\Http\FormRequest;

class StoreCouponRequest extends FormRequest
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
        return [
            'name' => 'required|string|max:' . Coupon::NAME_MAX_LENGTH,
            'customer_code' => 'nullable|string|max:' . Coupon::CUSTOMER_CODE_LENGTH . '|unique:coupons,customer_code',
            'description' => 'nullable|string|max:5000',
            'status' => 'nullable|in:active,inactive',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_per_user' => 'nullable|integer|min:1',
            'stackable' => 'nullable|boolean',
            'first_order_only' => 'nullable|boolean',
            'customer_type' => 'nullable|string|max:' . Coupon::CUSTOMER_TYPE_MAX_LENGTH,
            'region_rules' => 'required|array|min:1',
            'region_rules.*.market' => 'required|in:NP,INT',
            'region_rules.*.currency' => 'required|in:NPR,USD',
            'region_rules.*.discount_type' => 'required|in:percentage,fixed',
            'region_rules.*.discount_value' => 'required|numeric|min:0',
            'region_rules.*.minimum_subtotal' => 'nullable|numeric|min:0',
            'region_rules.*.maximum_discount' => 'nullable|numeric|min:0',
            'region_rules.*.free_shipping' => 'nullable|boolean',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'uuid|exists:products,id',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'uuid|exists:categories,id',
            'brand_ids' => 'nullable|array',
            'brand_ids.*' => 'uuid|exists:brands,id',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'uuid|exists:users,id',
        ];
    }
}
