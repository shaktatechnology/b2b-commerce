<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Admin only
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products,slug',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            
            // Categories pivot
            'category_ids' => 'required|array|min:1',
            'category_ids.*' => 'required|uuid|exists:categories,id',

            // Variants (At least one required)
            'variants' => 'required|array|min:1',
            'variants.*.variant_name' => 'required|string|max:255',
            'variants.*.sku' => 'required|string|max:100|unique:product_variants,sku',
            'variants.*.retail_price' => 'required|numeric|min:0',
            'variants.*.wholesale_price' => 'required|numeric|min:0',
            'variants.*.moq' => 'nullable|integer|min:1',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.weight' => 'nullable|numeric|min:0',
            'variants.*.is_active' => 'nullable|boolean',
        ];
    }
}
