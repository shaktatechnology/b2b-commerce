<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SocialLinkController;

// ── Auth (Public) ──────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:registration');
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:forgot-password');
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
Route::get('/reset-password/{token}', function ($token) {
    return response()->json([
        'message' => 'Please reset password via frontend',
        'token' => $token,
    ]);
})->name('password.reset');

// ── Public Read-only APIs ──────────────────────────────────────────────────
Route::get('/settings',             [SettingController::class, 'index']);
Route::get('/settings/{group}',     [SettingController::class, 'group']);
Route::get('/social-links',         [SocialLinkController::class, 'index']);

// ── Authenticated Routes (auth:sanctum) ────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // ── Admin: Settings ───────────────────────────────────────────────────
    Route::prefix('admin')->group(function () {

        // Settings
        Route::put('/settings',      [SettingController::class, 'update']);      // bulk upsert
        Route::put('/settings/{key}',[SettingController::class, 'updateOne']);   // single key

        // Social Links
        Route::get('/social-links',           [SocialLinkController::class, 'adminIndex']);
        Route::post('/social-links',          [SocialLinkController::class, 'store']);
        Route::put('/social-links/{id}',      [SocialLinkController::class, 'update']);
        Route::delete('/social-links/{id}',   [SocialLinkController::class, 'destroy']);
    });
});