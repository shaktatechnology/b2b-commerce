<?php

namespace App\Http\Requests\Api\Discount;

use Illuminate\Foundation\Http\FormRequest;

class CreateDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'product_id' => 'nullable|uuid|exists:products,id',
            'variant_id' => 'nullable|uuid|exists:product_variants,id',
            'type' => 'required_without_all:international_type,wholesale_type,wholesale_international_type|nullable|in:percent,fixed',
            'value' => 'required_with:type|nullable|numeric|min:0',
            'international_type' => 'nullable|in:percent,fixed',
            'international_value' => 'required_with:international_type|nullable|numeric|min:0',
            'wholesale_type' => 'nullable|in:percent,fixed',
            'wholesale_value' => 'required_with:wholesale_type|nullable|numeric|min:0',
            'wholesale_international_type' => 'nullable|in:percent,fixed',
            'wholesale_international_value' => 'required_with:wholesale_international_type|nullable|numeric|min:0',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
        ];
    }
}
