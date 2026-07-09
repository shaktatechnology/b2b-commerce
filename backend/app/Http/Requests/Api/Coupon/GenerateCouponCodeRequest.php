<?php

namespace App\Http\Requests\Api\Coupon;

use App\Models\Coupon;
use Illuminate\Foundation\Http\FormRequest;

class GenerateCouponCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'length' => 'nullable|integer|min:6|max:' . Coupon::CUSTOMER_CODE_LENGTH,
        ];
    }
}
