<?php

namespace App\Http\Requests\Api\Coupon;

use App\Models\Coupon;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCouponRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('coupon_code') && $this->input('coupon_code') !== null) {
            $merge['coupon_code'] = strtoupper(trim((string) $this->input('coupon_code')));
        } elseif ($this->has('customer_code') && $this->input('customer_code') !== null) {
            $merge['customer_code'] = strtoupper(trim((string) $this->input('customer_code')));
        }

        if ($this->has('region_rules') && is_array($this->input('region_rules'))) {
            $merge['region_rules'] = $this->normalizeRegionRules($this->input('region_rules'));
        }

        if (!empty($merge)) {
            $this->merge($merge);
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
            'coupon_code' => 'sometimes|nullable|string|max:' . Coupon::CUSTOMER_CODE_LENGTH . '|unique:coupons,customer_code,' . $couponId,
            /** @ignoreParam */
            'customer_code' => 'exclude_unless:coupon_code,null|sometimes|nullable|string|max:' . Coupon::CUSTOMER_CODE_LENGTH . '|unique:coupons,customer_code,' . $couponId,
            'description' => 'sometimes|nullable|string|max:5000',
            'status' => 'sometimes|nullable|in:active,inactive',
            'promotion_type' => 'sometimes|nullable|in:' . implode(',', Coupon::PROMOTION_TYPES),
            'auto_apply' => 'sometimes|nullable|boolean',
            'starts_at' => 'sometimes|nullable|date',
            'expires_at' => 'sometimes|nullable|date|after_or_equal:starts_at',
            'usage_limit' => 'sometimes|nullable|integer|min:1',
            'usage_per_user' => 'sometimes|nullable|integer|min:1',
            'stackable' => 'sometimes|nullable|boolean',
            'first_order_only' => 'sometimes|nullable|boolean',
            'customer_type' => 'sometimes|nullable|string|max:' . Coupon::CUSTOMER_TYPE_MAX_LENGTH,
            'payment_methods' => 'sometimes|nullable|array',
            'payment_methods.*' => 'string|max:64',
            'bogo_config' => 'sometimes|nullable|array',
            'bogo_config.buy_quantity' => 'required_with:bogo_config|integer|min:1',
            'bogo_config.get_quantity' => 'required_with:bogo_config|integer|min:1',
            'bogo_config.discount_type' => 'nullable|in:free,percentage,fixed',
            'bogo_config.discount_value' => 'nullable|numeric|min:0',
            'tier_config' => 'sometimes|nullable|array',
            'tier_config.*.minimum_subtotal' => 'required_with:tier_config|numeric|min:0',
            'tier_config.*.discount_type' => 'required_with:tier_config|in:percentage,fixed',
            'tier_config.*.discount_value' => 'required_with:tier_config|numeric|min:0',
            'tier_config.*.maximum_discount' => 'nullable|numeric|min:0',
            'region_rules' => 'sometimes|array|min:1',
            'region_rules.*.market' => 'required_with:region_rules|in:NP,INT',
            'region_rules.*.currency' => 'required_with:region_rules|in:NPR,USD',
            'region_rules.*.customer_type' => 'nullable|in:all,customer,wholesaler,retail,wholesale,wholeseller',
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

    private function normalizeRegionRules(array $rules): array
    {
        return array_map(function ($rule) {
            if (!is_array($rule)) {
                return $rule;
            }

            if (array_key_exists('currency', $rule) && $rule['currency'] !== null) {
                $rule['currency'] = strtoupper(trim((string) $rule['currency']));
            }

            if (array_key_exists('customer_type', $rule) && $rule['customer_type'] !== null) {
                $rule['customer_type'] = strtolower(trim((string) $rule['customer_type'])) ?: null;
            }

            return $rule;
        }, $rules);
    }
}
