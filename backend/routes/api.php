<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\ImageProxyController;
use App\Http\Controllers\Api\TranslationController;
use App\Http\Controllers\Api\SystemController;
use App\Http\Controllers\Api\SiteSettingController;

// Public routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

Route::get('/banners', [BannerController::class, 'index']);
Route::get('/banners/{id}', [BannerController::class, 'show']);

Route::get('/settings', [SiteSettingController::class, 'show']);

Route::get('/image-proxy', [ImageProxyController::class, 'show']);
Route::get('/translations', [TranslationController::class, 'index']);

// Auth routes
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Admin protected routes
    Route::middleware(['admin'])->group(function () {
        Route::post('/products/import', [ProductController::class, 'import']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/products/{id}', [ProductController::class, 'update']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);

        Route::post('/categories/import', [CategoryController::class, 'import']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::post('/categories/{id}', [CategoryController::class, 'update']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        Route::get('/banners/admin/all', [BannerController::class, 'adminIndex']);
        Route::post('/banners', [BannerController::class, 'store']);
        Route::post('/banners/{id}', [BannerController::class, 'update']);
        Route::put('/banners/{id}', [BannerController::class, 'update']);
        Route::delete('/banners/{id}', [BannerController::class, 'destroy']);

        Route::post('/translations', [TranslationController::class, 'store']);
        Route::post('/translations/reset', [TranslationController::class, 'reset']);

        Route::get('/system/status', [SystemController::class, 'status']);
        Route::post('/system/migrate', [SystemController::class, 'migrate']);
        Route::post('/system/cache-clear', [SystemController::class, 'clearCache']);

        Route::post('/settings', [SiteSettingController::class, 'update']);
        Route::put('/settings', [SiteSettingController::class, 'update']);
    });
});
