<?php

namespace App\Http\Requests\Api\Payment;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'payment_id' => 'required|uuid|exists:payments,id',
            'status' => 'required|string|in:completed,failed,refunded',
            'transaction_id' => 'nullable|string|max:255',
            'gateway_response' => 'nullable|array',
        ];
    }
}
