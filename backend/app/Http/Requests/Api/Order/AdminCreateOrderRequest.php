<?php

namespace App\Http\Requests\Api\Order;

use Illuminate\Foundation\Http\FormRequest;

class AdminCreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'user_id'                       => 'required|uuid|exists:users,id',
            'address_id'                    => 'nullable|string|max:255',
            'shipping_address'              => 'required|array',
            'shipping_address.street'       => 'required|string|max:255',
            'shipping_address.city'         => 'required|string|max:255',
            'shipping_address.state'        => 'required|string|max:255',
            'shipping_address.zip'          => 'required|string|max:20',
            'shipping_address.country'      => 'required|string|max:255',
            'notes'                         => 'nullable|string|max:2000',
            'items'                         => 'required|array|min:1',
            'items.*.variant_id'            => 'required|uuid|exists:product_variants,id',
            'items.*.quantity'              => 'required|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required'             => 'A customer must be selected.',
            'items.required'               => 'At least one product item is required.',
            'items.*.variant_id.required'  => 'Each item must have a valid product variant.',
            'items.*.quantity.min'         => 'Quantity must be at least 1.',
        ];
    }
}
