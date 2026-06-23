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
            'is_popular' => 'nullable|boolean',
            'is_top_selling' => 'nullable|boolean',
            'is_trending' => 'nullable|boolean',
            'brand_id' => 'nullable|uuid|exists:brands,id',
            'color_id' => 'nullable|uuid|exists:colors,id',
            'size_id' => 'nullable|uuid|exists:sizes,id',
            'weight' => 'nullable|string|max:255',
            'long_description' => 'nullable|string',
            'additional_info' => 'nullable|string',
            
            // Categories pivot
            'category_ids' => 'sometimes|required|array|min:1',
            'category_ids.*' => 'required|uuid|exists:categories,id',

            // Discounts
            'discount' => 'nullable',
            'discount.type' => 'required_with:discount|in:percent,fixed',
            'discount.value' => 'required_with:discount|numeric|min:0',
            'discount.starts_at' => 'required_with:discount|date',
            'discount.ends_at' => 'required_with:discount|date|after:discount.starts_at',
            'discount.is_active' => 'nullable|boolean',

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
            'variants.*.weight' => 'nullable|string|max:50',
            'variants.*.is_active' => 'nullable|boolean',
            'variants.*.image' => 'nullable|file|image|max:5120',
            'variants.*.image_url' => 'nullable|string|max:2083',
            'variants.*.color_id' => 'nullable|uuid|exists:colors,id',
            'variants.*.size_id' => 'nullable|uuid|exists:sizes,id',
            'variants.*.discount' => 'nullable',
            'variants.*.discount.type' => 'required_with:variants.*.discount|in:percent,fixed',
            'variants.*.discount.value' => 'required_with:variants.*.discount|numeric|min:0',
            'variants.*.discount.starts_at' => 'required_with:variants.*.discount|date',
            'variants.*.discount.ends_at' => 'required_with:variants.*.discount|date|after:variants.*.discount.starts_at',
            'variants.*.discount.is_active' => 'nullable|boolean',
        ];
    }
}
