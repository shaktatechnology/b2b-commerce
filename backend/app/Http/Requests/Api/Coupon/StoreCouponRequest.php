<?php

namespace App\Http\Requests\Api\Coupon;

use App\Models\Coupon;
use Illuminate\Foundation\Http\FormRequest;

class StoreCouponRequest extends FormRequest
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
        return [
            'name' => 'required|string|max:' . Coupon::NAME_MAX_LENGTH,
            'coupon_code' => 'nullable|string|max:' . Coupon::CUSTOMER_CODE_LENGTH . '|unique:coupons,customer_code',
            /** @ignoreParam */
            'customer_code' => 'exclude_unless:coupon_code,null|nullable|string|max:' . Coupon::CUSTOMER_CODE_LENGTH . '|unique:coupons,customer_code',
            'description' => 'nullable|string|max:5000',
            'status' => 'nullable|in:active,inactive',
            'promotion_type' => 'nullable|in:' . implode(',', Coupon::PROMOTION_TYPES),
            'auto_apply' => 'nullable|boolean',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_per_user' => 'nullable|integer|min:1',
            'stackable' => 'nullable|boolean',
            'first_order_only' => 'nullable|boolean',
            'customer_type' => 'nullable|string|max:' . Coupon::CUSTOMER_TYPE_MAX_LENGTH,
            'payment_methods' => 'nullable|array',
            'payment_methods.*' => 'string|max:64',
            'bogo_config' => 'nullable|array',
            'bogo_config.buy_quantity' => 'required_if:promotion_type,bogo|integer|min:1',
            'bogo_config.get_quantity' => 'required_if:promotion_type,bogo|integer|min:1',
            'bogo_config.discount_type' => 'nullable|in:free,percentage,fixed',
            'bogo_config.discount_value' => 'nullable|numeric|min:0',
            'tier_config' => 'nullable|array',
            'tier_config.*.minimum_subtotal' => 'required_with:tier_config|numeric|min:0',
            'tier_config.*.discount_type' => 'required_with:tier_config|in:percentage,fixed',
            'tier_config.*.discount_value' => 'required_with:tier_config|numeric|min:0',
            'tier_config.*.maximum_discount' => 'nullable|numeric|min:0',
            'region_rules' => 'required|array|min:1',
            'region_rules.*.market' => 'required|in:NP,INT',
            'region_rules.*.currency' => 'required|in:NPR,USD',
            'region_rules.*.customer_type' => 'nullable|in:all,customer,wholesaler,retail,wholesale,wholeseller',
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
