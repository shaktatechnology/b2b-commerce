<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'nullable|string|in:wholesaler,customer',
            'phone' => 'required|string|max:25',
            'company_name' => 'required_if:role,wholesaler|nullable|string|max:255',
            'address' => 'required_if:role,wholesaler|nullable|string|max:1000',
        ];
    }
}
