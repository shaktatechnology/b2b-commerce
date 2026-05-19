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
            'type' => 'required|in:percent,fixed',
            'value' => 'required|numeric|min:0',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
        ];
    }
}
