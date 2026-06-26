<?php

namespace App\Http\Requests\Api\Order;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'address_id' => 'nullable|string|max:255',
            // Allow either a previously saved `address_id` OR a full `shipping_address` payload
            'shipping_address' => 'required_without:address_id|array',
            'shipping_address.street' => 'required_without:address_id|string|max:255',
            'shipping_address.city' => 'required_without:address_id|string|max:255',
            // State and zip may be optional for some countries; require them only when shipping_address is provided
            'shipping_address.state' => 'required_without:address_id|string|max:255',
            'shipping_address.zip' => 'required_without:address_id|string|max:20',
            'shipping_address.country' => 'required_without:address_id|string|max:255',
            'currency' => 'nullable|string|in:NPR,USD',
            'notes' => 'nullable|string|max:2000',
        ];
    }
}
