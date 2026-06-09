<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SiteSettingController extends Controller
{
    public function show()
    {
        $settings = Cache::remember('site_settings', 300, function () {
            return $this->settings();
        });

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request)
    {
        $settings = $this->settings();

        $validated = $request->validate([
            'website_name' => 'required|string|max:255',
            'logo_name' => 'nullable|string|max:255',
            'logo_file' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,bmp,avif|max:20480',
            'remove_logo' => 'nullable|boolean',
        ]);

        unset($validated['logo_file'], $validated['remove_logo']);

        if ($request->boolean('remove_logo')) {
            $this->deleteLocalLogo($settings->logo);
            $validated['logo'] = null;
        }

        if ($request->hasFile('logo_file')) {
            $validated['logo'] = $this->storeLogo($request->file('logo_file'));
            $this->deleteLocalLogo($settings->logo);
        }

        $settings->update($validated);
        Cache::forget('site_settings');

        return response()->json(['data' => $settings->fresh()]);
    }

    private function settings(): SiteSetting
    {
        return SiteSetting::query()->first() ?: SiteSetting::create([
            'website_name' => 'Van Van Cambodia',
            'logo_name' => 'Van Van Cambodia',
        ]);
    }

    private function storeLogo(UploadedFile $file): string
    {
        if (!$file->isValid()) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Logo upload failed.');
        }

        if (!@getimagesize($file->getRealPath())) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'The selected logo is not a valid image.');
        }

        $directory = public_path('uploads/settings');

        if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Unable to create uploads/settings directory.');
        }

        if (!is_writable($directory)) {
            @chmod($directory, 0775);
        }

        if (!is_writable($directory)) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'uploads/settings directory is not writable.');
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'png');
        $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: 'png';
        $imageName = 'site-logo-' . Str::uuid() . '.' . $extension;
        $file->move($directory, $imageName);

        $imagePath = $directory . DIRECTORY_SEPARATOR . $imageName;
        @chmod($imagePath, 0644);

        return url('uploads/settings/' . $imageName);
    }

    private function deleteLocalLogo(?string $logoUrl): void
    {
        if (!$logoUrl || strpos($logoUrl, '/uploads/settings/') === false) {
            return;
        }

        $urlPath = parse_url($logoUrl, PHP_URL_PATH) ?: $logoUrl;
        $filename = basename(str_replace('\\', '/', $urlPath));

        if (!$filename) {
            return;
        }

        $path = public_path('uploads/settings/' . $filename);

        if (is_file($path)) {
            @unlink($path);
        }
    }
}
