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
            'phone' => 'nullable|string|max:25',
            'company_name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:1000',
        ];
    }
}
