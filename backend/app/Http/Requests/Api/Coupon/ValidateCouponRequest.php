<?php

namespace App\Http\Requests\Api\Coupon;

use App\Models\Coupon;
use Illuminate\Foundation\Http\FormRequest;

class ValidateCouponRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('coupon_code') && $this->input('coupon_code') !== null) {
            $merge['coupon_code'] = strtoupper(trim((string) $this->input('coupon_code')));
        } elseif ($this->has('code') && $this->input('code') !== null) {
            $merge['code'] = strtoupper(trim((string) $this->input('code')));
        }

        if ($this->has('currency') && $this->input('currency') !== null) {
            $merge['currency'] = strtoupper(trim((string) $this->input('currency')));
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'coupon_code' => 'required_without:code|string|max:' . Coupon::SECURE_CODE_LENGTH,
            'code' => 'required_without:coupon_code|string|max:' . Coupon::SECURE_CODE_LENGTH,
            'subtotal' => 'required|numeric|min:0',
            'shipping_address' => 'required|array',
            'currency' => 'nullable|in:NPR,USD',
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
