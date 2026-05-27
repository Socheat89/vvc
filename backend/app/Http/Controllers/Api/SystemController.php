<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    /**
     * Get system configuration, database, and cache status info.
     */
    public function status()
    {
        $dbConnected = false;
        $dbError = null;
        try {
            DB::connection()->getPdo();
            $dbConnected = true;
        } catch (\Exception $e) {
            $dbError = $e->getMessage();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'environment' => app()->environment(),
                'database' => [
                    'connected' => $dbConnected,
                    'driver' => DB::connection()->getDriverName(),
                    'database_name' => DB::connection()->getDatabaseName(),
                    'error' => $dbError
                ],
                'cache' => [
                    'driver' => config('cache.default'),
                ]
            ]
        ]);
    }

    /**
     * Run database migrations securely.
     */
    public function migrate()
    {
        try {
            // Artisan::call returns 0 on success
            $exitCode = Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();

            return response()->json([
                'success' => $exitCode === 0,
                'message' => $exitCode === 0 ? 'Migrations executed successfully' : 'Migration failed',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Migration crashed with error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear application configuration, route, and data caches.
     */
    public function clearCache()
    {
        try {
            Artisan::call('cache:clear');
            $cacheOutput = Artisan::output();

            Artisan::call('config:clear');
            $configOutput = Artisan::output();

            Artisan::call('route:clear');
            $routeOutput = Artisan::output();

            return response()->json([
                'success' => true,
                'message' => 'System cache cleared successfully',
                'details' => [
                    'cache' => trim($cacheOutput),
                    'config' => trim($configOutput),
                    'route' => trim($routeOutput)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear system cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
