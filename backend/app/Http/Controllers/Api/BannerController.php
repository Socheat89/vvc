<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class BannerController extends Controller
{
    // GET /api/banners - Public
    public function index()
    {
        $banners = \Illuminate\Support\Facades\Cache::remember('banners_all', 300, function () {
            return Banner::where('active', true)
                ->orderBy('position')
                ->get();
        });

        return response()->json([
            'data' => $banners
        ]);
    }

    // GET /api/banners/{id} - Public
    public function show($id)
    {
        $banner = Banner::find($id);

        if (!$banner) {
            return response()->json(['message' => 'Banner not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['data' => $banner]);
    }

    // POST /api/banners - Admin only
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'nullable|string|max:255',
                'tone' => 'required|in:gold,paper,ink',
                'position' => 'nullable|integer|min:0',
                'active' => 'nullable|boolean',
                'image_file' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,bmp,avif|max:20480',
            ]);

            unset($validated['image_file']);

            if (!isset($validated['position'])) {
                $validated['position'] = (Banner::max('position') ?? -1) + 1;
            }

            if (!isset($validated['active'])) {
                $validated['active'] = true;
            }

            if ($request->hasFile('image_file')) {
                $validated['image'] = $this->storeWebpImage($request->file('image_file'));
            }

            $banner = Banner::create($validated);

            \Illuminate\Support\Facades\Cache::forget('banners_all');

            return response()->json(['data' => $banner], Response::HTTP_CREATED);
        } catch (\Throwable $error) {
            return $this->bannerSaveErrorResponse($error);
        }
    }

    // PUT /api/banners/{id} - Admin only
    public function update(Request $request, $id)
    {
        try {
            $banner = Banner::find($id);

            if (!$banner) {
                return response()->json(['message' => 'Banner not found'], Response::HTTP_NOT_FOUND);
            }

            $validated = $request->validate([
                'title' => 'nullable|string|max:255',
                'tone' => 'sometimes|in:gold,paper,ink',
                'position' => 'nullable|integer|min:0',
                'active' => 'nullable|boolean',
                'image_file' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,bmp,avif|max:20480',
            ]);

            unset($validated['image_file']);

            if ($request->hasFile('image_file')) {
                $validated['image'] = $this->storeWebpImage($request->file('image_file'));

                $this->deleteLocalBannerImage($banner->image);
            }

            $banner->update($validated);

            \Illuminate\Support\Facades\Cache::forget('banners_all');

            return response()->json(['data' => $banner]);
        } catch (\Throwable $error) {
            return $this->bannerSaveErrorResponse($error);
        }
    }

    // DELETE /api/banners/{id} - Admin only
    public function destroy($id)
    {
        $banner = Banner::find($id);

        if (!$banner) {
            return response()->json(['message' => 'Banner not found'], Response::HTTP_NOT_FOUND);
        }

        $this->deleteLocalBannerImage($banner->image);
        $banner->delete();

        \Illuminate\Support\Facades\Cache::forget('banners_all');

        return response()->json(['message' => 'Banner deleted successfully']);
    }

    // GET /api/banners/admin/all - Admin only (get all banners including inactive)
    public function adminIndex()
    {
        $banners = Banner::orderBy('position')->get();

        return response()->json([
            'data' => $banners
        ]);
    }

    private function storeWebpImage(UploadedFile $file): string
    {
        $directory = public_path('uploads/banners');

        if (!is_dir($directory) && !@mkdir($directory, 0755, true)) {
            throw new \RuntimeException('Failed to create uploads/banners directory.');
        }

        if (!is_writable($directory)) {
            throw new \RuntimeException('uploads/banners directory is not writable.');
        }

        $filename = 'banner-' . Str::uuid();
        $webpPath = $directory . DIRECTORY_SEPARATOR . $filename . '.webp';

        if ($this->convertImagePathToWebp($file->getRealPath(), $webpPath)) {
            @chmod($webpPath, 0644);
            return $this->publicBannerImageUrl($webpPath);
        }

        if (is_file($webpPath)) {
            @unlink($webpPath);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg');
        $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: 'jpg';
        $fallbackName = $filename . '.' . $extension;
        $file->move($directory, $fallbackName);

        $fallbackPath = $directory . DIRECTORY_SEPARATOR . $fallbackName;
        @chmod($fallbackPath, 0644);

        return $this->publicBannerImageUrl($fallbackPath);
    }

    private function bannerSaveErrorResponse(\Throwable $error)
    {
        report($error);

        $message = config('app.debug')
            ? $error->getMessage()
            : 'Unable to save banner. Please make sure uploads/banners is writable and the selected image is valid.';

        return response()->json([
            'message' => $message,
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function convertImagePathToWebp(string $source, string $destination): bool
    {
        if (!function_exists('imagewebp')) {
            return false;
        }

        $info = @getimagesize($source);

        if (!$info) {
            return false;
        }

        $type = $info[2] ?? null;
        $loader = null;

        if ($type === IMAGETYPE_JPEG && function_exists('imagecreatefromjpeg')) {
            $loader = 'imagecreatefromjpeg';
        } elseif ($type === IMAGETYPE_PNG && function_exists('imagecreatefrompng')) {
            $loader = 'imagecreatefrompng';
        } elseif ($type === IMAGETYPE_GIF && function_exists('imagecreatefromgif')) {
            $loader = 'imagecreatefromgif';
        } elseif ($type === IMAGETYPE_WEBP && function_exists('imagecreatefromwebp')) {
            $loader = 'imagecreatefromwebp';
        } elseif ($type === IMAGETYPE_BMP && function_exists('imagecreatefrombmp')) {
            $loader = 'imagecreatefrombmp';
        } elseif (defined('IMAGETYPE_AVIF') && $type === IMAGETYPE_AVIF && function_exists('imagecreatefromavif')) {
            $loader = 'imagecreatefromavif';
        }

        if (!$loader) {
            return false;
        }

        $image = @$loader($source);

        if (!$image) {
            return false;
        }

        if (function_exists('imagepalettetotruecolor')) {
            imagepalettetotruecolor($image);
        }

        if (function_exists('imagealphablending')) {
            imagealphablending($image, false);
        }

        if (function_exists('imagesavealpha')) {
            imagesavealpha($image, true);
        }

        $saved = @imagewebp($image, $destination, 82);
        imagedestroy($image);

        return $saved;
    }

    private function publicBannerImageUrl(string $path): string
    {
        return url('uploads/banners/' . basename($path));
    }

    private function deleteLocalBannerImage(?string $imageUrl): void
    {
        if (!$imageUrl || !str_contains($imageUrl, '/uploads/banners/')) {
            return;
        }

        $path = public_path('uploads/banners/' . basename(parse_url($imageUrl, PHP_URL_PATH)));

        if (is_file($path)) {
            @unlink($path);
        }
    }
}
