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
        ];
    }
}
