<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SocialLinkController;

// ── Auth (Public) ──────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Public Read-only APIs ──────────────────────────────────────────────────
Route::get('/settings',             [SettingController::class, 'index']);
Route::get('/settings/{group}',     [SettingController::class, 'group']);
Route::get('/social-links',         [SocialLinkController::class, 'index']);

// ── Authenticated Routes (auth:sanctum) ────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      fn(Request $request) => response()->json(['data' => $request->user()]));

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