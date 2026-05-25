<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BannerController;

// Public routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::get('/run-composer-install', function (\Illuminate\Http\Request $request) {
    if ($request->query('key') !== 'vvc-install-2026') {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    try {
        chdir(base_path());
        $output = [];
        $returnVar = 0;
        
        // Check if exec is enabled
        if (!function_exists('exec')) {
            return response()->json([
                'status' => 'error',
                'message' => 'The exec() function is disabled in your PHP configuration. Please ask your hosting provider to enable it, or run composer install via cPanel Terminal.'
            ], 400);
        }

        // Run composer install
        exec('composer install --no-dev --optimize-autoloader 2>&1', $output, $returnVar);
        
        // If it failed, try using composer.phar
        if ($returnVar !== 0) {
            $output[] = 'System composer failed, attempting to download composer.phar...';
            if (!file_exists('composer.phar')) {
                copy('https://getcomposer.org/installer', 'composer-setup.php');
                exec('php composer-setup.php 2>&1', $output, $returnVar);
                @unlink('composer-setup.php');
            }
            exec('php composer.phar install --no-dev --optimize-autoloader 2>&1', $output, $returnVar);
        }
        
        return response()->json([
            'status' => $returnVar === 0 ? 'success' : 'error',
            'return_code' => $returnVar,
            'output' => $output
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

Route::get('/banners', [BannerController::class, 'index']);
Route::get('/banners/{id}', [BannerController::class, 'show']);

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
    });
});
