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
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'tone' => 'required|in:gold,paper,ink',
            'position' => 'nullable|integer|min:0',
            'active' => 'nullable|boolean',
            'image_file' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,bmp,avif|max:20480',
        ]);

        unset($validated['image_file']);

        if (!isset($validated['position'])) {
            $validated['position'] = Banner::max('position') + 1 ?? 0;
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
    }

    // PUT /api/banners/{id} - Admin only
    public function update(Request $request, $id)
    {
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

        // Ensure directory exists with proper permissions
        if (!is_dir($directory)) {
            if (!mkdir($directory, 0777, true)) {
                throw new \Exception('Failed to create uploads/banners directory.');
            }
        }

        // Make sure directory is writable
        if (!is_writable($directory)) {
            if (!chmod($directory, 0777)) {
                throw new \Exception('uploads/banners directory is not writable.');
            }
        }

        $filename = 'banner-' . Str::uuid();
        
        // Try to save as WebP
        $webpPath = $directory . DIRECTORY_SEPARATOR . $filename . '.webp';
        if ($this->convertImagePathToWebp($file->getRealPath(), $webpPath)) {
            chmod($webpPath, 0644);
            return url('index.php/uploads/banners/' . $filename . '.webp');
        }
        
        // Fallback: copy original file if WebP conversion fails
        $originalExtension = strtolower($file->getClientOriginalExtension());
        $fallbackPath = $directory . DIRECTORY_SEPARATOR . $filename . '.' . $originalExtension;
        
        if ($file->copy($directory, $filename . '.' . $originalExtension)) {
            chmod($fallbackPath, 0644);
            return url('index.php/uploads/banners/' . $filename . '.' . $originalExtension);
        }
        
        throw new \Exception('Unable to save image file.');
    }

    private function convertImagePathToWebp(string $source, string $destination): bool
    {
        $info = @getimagesize($source);

        if (!$info) {
            return false;
        }

        $image = match ($info[2]) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($source),
            IMAGETYPE_PNG => imagecreatefrompng($source),
            IMAGETYPE_GIF => imagecreatefromgif($source),
            IMAGETYPE_WEBP => imagecreatefromwebp($source),
            IMAGETYPE_BMP => imagecreatefrombmp($source),
            IMAGETYPE_AVIF => function_exists('imagecreatefromavif') ? imagecreatefromavif($source) : false,
            default => false,
        };

        if (!$image) {
            return false;
        }

        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        $saved = imagewebp($image, $destination, 82);
        imagedestroy($image);

        return $saved;
    }

    private function publicBannerImageUrl(string $path): string
    {
        $filename = basename($path);
        return url('index.php/uploads/banners/' . $filename);
    }

    private function deleteLocalBannerImage(?string $imageUrl): void
    {
        if (!$imageUrl || !str_contains($imageUrl, '/uploads/banners/')) {
            return;
        }

        $path = public_path('uploads/banners/' . basename(parse_url($imageUrl, PHP_URL_PATH)));

        if (is_file($path)) {
            unlink($path);
        }
    }
}
