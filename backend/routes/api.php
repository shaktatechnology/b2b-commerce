<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SocialLinkController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\Offer\OfferController;
use App\Http\Controllers\Api\Discount\DiscountController;
use App\Http\Controllers\Api\Cart\CartController;
use App\Http\Controllers\Api\Order\OrderController;
use App\Http\Controllers\Api\Payment\PaymentController;
use App\Http\Controllers\Api\Payment\PayPalController;
use App\Http\Controllers\Api\Payment\EsewaController;
use App\Http\Controllers\Api\Review\ReviewController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ColorController;
use App\Http\Controllers\Api\SizeController;
use App\Http\Controllers\Admin\WholesalerController;
use App\Http\Controllers\Admin\UserController;

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

// Master Attributes
Route::get('/brands',               [BrandController::class, 'index']);
Route::get('/colors',               [ColorController::class, 'index']);
Route::get('/sizes',                [SizeController::class, 'index']);

// Products
Route::get('/products',             [ProductController::class, 'index']);
Route::get('/products/{slug}/reviews', [ReviewController::class, 'index']);
Route::get('/products/{slug}',       [ProductController::class, 'show']);

// Offers
Route::get('/offers',               [OfferController::class, 'index']);
Route::get('/offers/{id}',          [OfferController::class, 'show']);

// Discounts
Route::get('/discounts',            [DiscountController::class, 'index']);
Route::get('/discounts/{id}',       [DiscountController::class, 'show']);

// ── Authenticated Routes (auth:sanctum) ────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Product reviews (authenticated)
    Route::get('/products/{slug}/reviews/me', [ReviewController::class, 'myReview']);
    Route::get('/products/{slug}/reviews/can-review', [ReviewController::class, 'canReview']);
    Route::post('/products/{slug}/reviews', [ReviewController::class, 'store']);
    Route::put('/products/{slug}/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/products/{slug}/reviews/{id}', [ReviewController::class, 'destroy']);

    // Cart
    Route::get('/cart',              [CartController::class, 'index']);
    Route::post('/cart',             [CartController::class, 'store']);
    Route::put('/cart/items/{id}',   [CartController::class, 'update']);
    Route::delete('/cart/items/{id}',[CartController::class, 'destroy']);
    Route::delete('/cart',           [CartController::class, 'clear']);
    Route::post('/cart/sync',        [CartController::class, 'sync']);

    // Orders
    Route::get('/orders',            [OrderController::class, 'index']);
    Route::post('/orders',           [OrderController::class, 'store']); // Checkout
    Route::get('/orders/{id}',       [OrderController::class, 'show']);

    // Payments
    Route::post('/payments/initiate', [PaymentController::class, 'initiate']);
    Route::post('/payments/verify',   [PaymentController::class, 'verify']);
    Route::get('/payments/{id}',      [PaymentController::class, 'show']);

    // PayPal Payments
    Route::post('/paypal/create-order', [PayPalController::class, 'createOrder']);
    Route::post('/paypal/capture-order', [PayPalController::class, 'captureOrder']);
    Route::get('/paypal/return', [PayPalController::class, 'handleReturn']);

    // eSewa Payments
    Route::post('/esewa/success', [EsewaController::class, 'handleSuccess']);
    Route::post('/esewa/failure', [EsewaController::class, 'handleFailure']);

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

        // Master Attributes
        Route::post('/brands',                [BrandController::class, 'store']);
        Route::put('/brands/{brand}',         [BrandController::class, 'update']);
        Route::delete('/brands/{brand}',      [BrandController::class, 'destroy']);
        
        Route::post('/colors',                [ColorController::class, 'store']);
        Route::put('/colors/{color}',         [ColorController::class, 'update']);
        Route::delete('/colors/{color}',      [ColorController::class, 'destroy']);
        
        Route::post('/sizes',                 [SizeController::class, 'store']);
        Route::put('/sizes/{size}',           [SizeController::class, 'update']);
        Route::delete('/sizes/{size}',        [SizeController::class, 'destroy']);

        // Products & Variants
        Route::post('/products',              [ProductController::class, 'store']);
        Route::put('/products/{id}',          [ProductController::class, 'update']);
        Route::delete('/products/{id}',        [ProductController::class, 'destroy']);

        // Product Images
        Route::post('/products/{id}/images',  [ProductController::class, 'uploadImage']);
        Route::delete('/products/images/{imageId}', [ProductController::class, 'deleteImage']);
        Route::delete('/products/{id}/images', [ProductController::class, 'deleteProductImages']);

        // Offers
        Route::post('/offers',                [OfferController::class, 'store']);
        Route::put('/offers/{id}',            [OfferController::class, 'update']);
        Route::post('/offers/{id}',           [OfferController::class, 'update']); // POST fallback for form-data file uploads
        Route::delete('/offers/{id}',         [OfferController::class, 'destroy']);

        // Discounts
        Route::post('/discounts',             [DiscountController::class, 'store']);
        Route::put('/discounts/{id}',         [DiscountController::class, 'update']);
        Route::delete('/discounts/{id}',      [DiscountController::class, 'destroy']);

        // Orders
        Route::get('/orders',                 [OrderController::class, 'adminIndex']);
        Route::get('/orders/{id}',            [OrderController::class, 'adminShow']);
        Route::put('/orders/{id}',            [OrderController::class, 'adminUpdate']);

        // Payments
        Route::get('/payments',               [PaymentController::class, 'adminIndex']);
        Route::get('/payments/{id}',          [PaymentController::class, 'adminShow']);

        // Users
        Route::get('/users',                   [UserController::class, 'index']);
        Route::get('/users/{id}',              [UserController::class, 'show']);
        Route::get('/users/{id}/history',      [UserController::class, 'purchaseHistory']);
        Route::delete('/users/{id}',           [UserController::class, 'destroy']);

        // Wholesalers
        Route::get('/wholesalers',             [WholesalerController::class, 'index']);
        Route::get('/wholesalers/pending',     [WholesalerController::class, 'pending']);
        Route::patch('/wholesalers/{id}/approve', [WholesalerController::class, 'approve']);
        Route::patch('/wholesalers/{id}/reject',  [WholesalerController::class, 'reject']);
    });
});
