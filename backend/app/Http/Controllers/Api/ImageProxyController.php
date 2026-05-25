<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;

class ImageProxyController extends Controller
{
    public function show(Request $request)
    {
        $uploadPath = str_replace('\\', '/', (string) $request->query('path', ''));
        $uploadPath = ltrim($uploadPath, '/');

        if (!preg_match('#^uploads/(products|categories|banners)/[^/]+$#', $uploadPath)) {
            return response()->json(['message' => 'Invalid image path.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $uploadsRoot = realpath(public_path('uploads'));
        $imagePath = realpath(public_path($uploadPath));

        if (!$uploadsRoot || !$imagePath || !str_starts_with($imagePath, $uploadsRoot . DIRECTORY_SEPARATOR) || !is_file($imagePath)) {
            return response()->json(['message' => 'Image not found.'], Response::HTTP_NOT_FOUND);
        }

        return response()->file($imagePath, [
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'Content-Type' => File::mimeType($imagePath) ?: 'application/octet-stream',
            'Cross-Origin-Resource-Policy' => 'cross-origin',
        ]);
    }
}
