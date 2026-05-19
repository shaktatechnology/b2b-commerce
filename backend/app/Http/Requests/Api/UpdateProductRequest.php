<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Admin only
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        $productId = $this->route('id');

        return [
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products,slug,' . $productId,
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            
            // Categories pivot
            'category_ids' => 'sometimes|required|array|min:1',
            'category_ids.*' => 'required|uuid|exists:categories,id',

            // Variants
            'sync_variants' => 'nullable|boolean',
            'variants' => 'sometimes|required|array|min:1',
            'variants.*.id' => 'nullable|uuid|exists:product_variants,id',
            'variants.*.variant_name' => 'required_without:variants.*.id|string|max:255',
            'variants.*.sku' => [
                'required',
                'string',
                'max:100',
                function ($attribute, $value, $fail) {
                    // Extract index to check if variant has ID
                    preg_match('/variants\.(\d+)\.sku/', $attribute, $matches);
                    if (count($matches) > 1) {
                        $index = $matches[1];
                        $variantId = $this->input("variants.{$index}.id");
                        
                        $query = \App\Models\ProductVariant::where('sku', $value);
                        if ($variantId) {
                            $query->where('id', '!=', $variantId);
                        }
                        if ($query->exists()) {
                            $fail('The SKU has already been taken.');
                        }
                    }
                }
            ],
            'variants.*.retail_price' => 'sometimes|required|numeric|min:0',
            'variants.*.wholesale_price' => 'sometimes|required|numeric|min:0',
            'variants.*.moq' => 'nullable|integer|min:1',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.weight' => 'nullable|numeric|min:0',
            'variants.*.is_active' => 'nullable|boolean',
        ];
    }
}
