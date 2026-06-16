<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Interfaces\AuthServiceInterface;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\ForgotPasswordRequest;
use App\Http\Requests\Api\ResetPasswordRequest;
use App\Http\Requests\Api\UpdateProfileRequest;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthServiceInterface $authService)
    {
        $this->authService = $authService;
    }

    public function register(RegisterRequest $request)
    {
        $data = $this->authService->register($request->validated());

        return response()->json([
            'message' => 'User registered successfully',
            'data' => $data
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $data = $this->authService->login($request->validated());

        if (!$data) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (($data['blocked'] ?? false) === true) {
            return response()->json([
                'message' => $data['message']
            ], 403);
        }

        return response()->json([
            'message' => 'Login successful',
            'data' => $data
        ]);
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $sent = $this->authService->forgotPassword($request->email);

        if (!$sent) {
            return response()->json([
                'message' => 'Could not send reset link'
            ], 500);
        }

        return response()->json([
            'message' => 'Reset link sent to your email'
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $reset = $this->authService->resetPassword($request->validated());

        if (!$reset) {
            return response()->json([
                'message' => 'Invalid token or email'
            ], 400);
        }

        return response()->json([
            'message' => 'Password reset successfully'
        ]);
    }

    public function profile(Request $request)
    {
        $user = $this->authService->getProfile($request->user());

        return response()->json([
            'data' => $user
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $user
        ]);
    }
}
