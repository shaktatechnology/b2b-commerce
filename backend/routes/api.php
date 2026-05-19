<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SocialLinkController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;

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

// Categories
Route::get('/categories',           [CategoryController::class, 'index']);
Route::get('/categories/{slug}',     [CategoryController::class, 'show']);

// Products
Route::get('/products',             [ProductController::class, 'index']);
Route::get('/products/{slug}',       [ProductController::class, 'show']);

// ── Authenticated Routes (auth:sanctum) ────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // ── Admin Protected APIs (role:admin) ───────────────────────────────────
    Route::prefix('admin')->middleware('role:admin')->group(function () {

        // Settings
        Route::put('/settings',      [SettingController::class, 'update']);      // bulk upsert
        Route::put('/settings/{key}',[SettingController::class, 'updateOne']);   // single key

        // Social Links
        Route::get('/social-links',           [SocialLinkController::class, 'adminIndex']);
        Route::post('/social-links',          [SocialLinkController::class, 'store']);
        Route::put('/social-links/{id}',      [SocialLinkController::class, 'update']);
        Route::delete('/social-links/{id}',   [SocialLinkController::class, 'destroy']);

        // Categories
        Route::post('/categories',            [CategoryController::class, 'store']);
        Route::put('/categories/{id}',        [CategoryController::class, 'update']);
        Route::post('/categories/{id}',       [CategoryController::class, 'update']); // POST fallback for form-data image uploads
        Route::delete('/categories/{id}',     [CategoryController::class, 'destroy']);

        // Products & Variants
        Route::post('/products',              [ProductController::class, 'store']);
        Route::put('/products/{id}',          [ProductController::class, 'update']);
        Route::delete('/products/{id}',        [ProductController::class, 'destroy']);

        // Product Images
        Route::post('/products/{id}/images',  [ProductController::class, 'uploadImage']);
        Route::delete('/products/images/{imageId}', [ProductController::class, 'deleteImage']);
    });
});