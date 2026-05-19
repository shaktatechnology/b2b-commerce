<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Admin only
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        $categoryId = $this->route('id');

        return [
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug,' . $categoryId,
            'parent_id' => 'nullable|uuid|exists:categories,id',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
        ];
    }
}
