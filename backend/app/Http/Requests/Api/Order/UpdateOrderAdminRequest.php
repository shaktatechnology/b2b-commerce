<?php

namespace App\Http\Requests\Api\Order;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'status' => 'nullable|string|in:pending,confirmed,processing,shipped,delivered,cancelled',
            'payment_status' => 'nullable|string|in:unpaid,paid,refunded',
        ];
    }
}
