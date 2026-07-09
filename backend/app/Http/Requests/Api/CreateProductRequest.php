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
            'category_ids' => 'required|array|min:1',
            'category_ids.*' => 'required|uuid|exists:categories,id',

            // Tags pivot
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'required|uuid|exists:tags,id',

            // Discounts
            'discount' => 'nullable|array',
            'discount.type' => 'nullable|in:percent,fixed',
            'discount.value' => 'required_with:discount.type|nullable|numeric|min:0',
            'discount.international_type' => 'nullable|in:percent,fixed',
            'discount.international_value' => 'required_with:discount.international_type|nullable|numeric|min:0',
            'discount.wholesale_type' => 'nullable|in:percent,fixed',
            'discount.wholesale_value' => 'required_with:discount.wholesale_type|nullable|numeric|min:0',
            'discount.wholesale_international_type' => 'nullable|in:percent,fixed',
            'discount.wholesale_international_value' => 'required_with:discount.wholesale_international_type|nullable|numeric|min:0',
            'discount.starts_at' => 'required_with:discount|date',
            'discount.ends_at' => 'required_with:discount|date|after:discount.starts_at',
            'discount.is_active' => 'nullable|boolean',

            // Variants (At least one required)
            'variants' => 'required|array|min:1',
            'variants.*.variant_name' => 'required|string|max:255',
            'variants.*.sku' => 'required|string|max:100|unique:product_variants,sku',
            'variants.*.retail_price' => 'required|numeric|min:0',
            'variants.*.wholesale_price' => 'required|numeric|min:0',
            'variants.*.international_price' => 'nullable|numeric|min:0',
            'variants.*.international_wholesale_price' => 'nullable|numeric|min:0',
            'variants.*.moq' => 'nullable|integer|min:1',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.weight' => 'nullable|string|max:50',
            'variants.*.is_active' => 'nullable|boolean',
            'variants.*.image' => 'nullable|file|image|max:5120',
            'variants.*.image_url' => 'nullable|string|max:2083',
            'variants.*.color_id' => 'nullable|uuid|exists:colors,id',
            'variants.*.size_id' => 'nullable|uuid|exists:sizes,id',
            'variants.*.discount' => 'nullable|array',
            'variants.*.discount.type' => 'nullable|in:percent,fixed',
            'variants.*.discount.value' => 'required_with:variants.*.discount.type|nullable|numeric|min:0',
            'variants.*.discount.international_type' => 'nullable|in:percent,fixed',
            'variants.*.discount.international_value' => 'required_with:variants.*.discount.international_type|nullable|numeric|min:0',
            'variants.*.discount.wholesale_type' => 'nullable|in:percent,fixed',
            'variants.*.discount.wholesale_value' => 'required_with:variants.*.discount.wholesale_type|nullable|numeric|min:0',
            'variants.*.discount.wholesale_international_type' => 'nullable|in:percent,fixed',
            'variants.*.discount.wholesale_international_value' => 'required_with:variants.*.discount.wholesale_international_type|nullable|numeric|min:0',
            'variants.*.discount.starts_at' => 'required_with:variants.*.discount|date',
            'variants.*.discount.ends_at' => 'required_with:variants.*.discount|date|after:variants.*.discount.starts_at',
            'variants.*.discount.is_active' => 'nullable|boolean',
        ];
    }
}
