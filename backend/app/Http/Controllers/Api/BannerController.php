<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
                $validated['image'] = $this->storeBannerImage($request->file('image_file'));
            }

            $banner = Banner::create($validated);

            \Illuminate\Support\Facades\Cache::forget('banners_all');

            return response()->json(['data' => $banner], Response::HTTP_CREATED);
        } catch (ValidationException $error) {
            throw $error;
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
                $validated['image'] = $this->storeBannerImage($request->file('image_file'));

                $this->deleteLocalBannerImage($banner->image);
            }

            $banner->update($validated);

            \Illuminate\Support\Facades\Cache::forget('banners_all');

            return response()->json(['data' => $banner]);
        } catch (ValidationException $error) {
            throw $error;
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

    private function storeBannerImage(UploadedFile $file): string
    {
        if (!$file->isValid()) {
            throw new \RuntimeException('Banner image upload failed: ' . $file->getErrorMessage());
        }

        if ((int) $file->getSize() <= 0) {
            throw new \RuntimeException('Banner image upload is empty.');
        }

        $directory = $this->ensureBannerUploadDirectory();
        $filename = 'banner-' . Str::uuid();

        if ($this->shouldConvertBannerToWebp()) {
            $sourcePath = $file->getRealPath();
            $webpPath = $directory . DIRECTORY_SEPARATOR . $filename . '.webp';

            if ($sourcePath && $this->convertImagePathToWebp($sourcePath, $webpPath)) {
                @chmod($webpPath, 0644);
                return $this->publicBannerImageUrl($webpPath);
            }

            @unlink($webpPath);
        }

        return $this->storeOriginalBannerImage($file, $directory, $filename);
    }

    private function storeOriginalBannerImage(UploadedFile $file, string $directory, string $filename): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg');
        $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: 'jpg';
        $imageName = $filename . '.' . $extension;
        $file->move($directory, $imageName);

        $imagePath = $directory . DIRECTORY_SEPARATOR . $imageName;
        @chmod($imagePath, 0644);

        if (!$this->isUsableImageFile($imagePath)) {
            @unlink($imagePath);
            throw new \RuntimeException('Unable to save banner image file.');
        }

        return $this->publicBannerImageUrl($imagePath);
    }

    private function convertImagePathToWebp(string $source, string $destination): bool
    {
        if (!function_exists('imagewebp') || !is_readable($source)) {
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
            @imagepalettetotruecolor($image);
        }

        if (function_exists('imagealphablending')) {
            @imagealphablending($image, false);
        }

        if (function_exists('imagesavealpha')) {
            @imagesavealpha($image, true);
        }

        $saved = @imagewebp($image, $destination, 82);
        imagedestroy($image);

        if (!$saved || !$this->isUsableImageFile($destination)) {
            @unlink($destination);
            return false;
        }

        return true;
    }

    private function bannerSaveErrorResponse(\Throwable $error)
    {
        try {
            report($error);
        } catch (\Throwable $reportError) {
            // Keep the API response useful even if server logging/storage is misconfigured.
        }

        $message = config('app.debug')
            ? $error->getMessage()
            : 'Unable to save banner. Please make sure uploads/banners is writable and the selected image is valid.';

        return response()->json([
            'message' => $message,
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function publicBannerImageUrl(string $path): string
    {
        $filename = basename($path);
        return url('uploads/banners/' . $filename);
    }

    private function shouldConvertBannerToWebp(): bool
    {
        return filter_var(env('BANNER_CONVERT_WEBP', false), FILTER_VALIDATE_BOOLEAN);
    }

    private function isUsableImageFile(string $path): bool
    {
        clearstatcache(true, $path);

        if (!is_file($path) || filesize($path) <= 0) {
            return false;
        }

        if (@getimagesize($path) !== false) {
            return true;
        }

        return strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'webp';
    }

    private function ensureBannerUploadDirectory(): string
    {
        $directory = public_path('uploads/banners');

        if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
            throw new \RuntimeException('Failed to create uploads/banners directory.');
        }

        if (!is_writable($directory)) {
            @chmod($directory, 0775);
        }

        if (!is_writable($directory)) {
            throw new \RuntimeException('uploads/banners directory is not writable.');
        }

        $testPath = $directory . DIRECTORY_SEPARATOR . '.write-test-' . uniqid('', true) . '.tmp';

        if (@file_put_contents($testPath, 'ok') === false) {
            throw new \RuntimeException('Unable to write a test file to uploads/banners.');
        }

        @unlink($testPath);

        return $directory;
    }

    private function deleteLocalBannerImage(?string $imageUrl): void
    {
        if (!$imageUrl || strpos($imageUrl, '/uploads/banners/') === false) {
            return;
        }

        $urlPath = parse_url($imageUrl, PHP_URL_PATH) ?: $imageUrl;
        $filename = basename(str_replace('\\', '/', $urlPath));

        if (!$filename) {
            return;
        }

        $path = public_path('uploads/banners/' . $filename);

        if (is_file($path)) {
            @unlink($path);
        }
    }
}
