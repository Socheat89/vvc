<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Translation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TranslationController extends Controller
{
    public function index()
    {
        $translations = Cache::remember('translations_all', 600, function () {
            return Translation::orderBy('key', 'asc')->get();
        });
        return response()->json(['data' => $translations]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'translations' => 'required|array',
            'translations.*.key' => 'required|string',
            'translations.*.en' => 'required|string',
            'translations.*.kh' => 'required|string',
        ]);

        foreach ($validated['translations'] as $item) {
            Translation::updateOrCreate(
                ['key' => $item['key']],
                ['en' => $item['en'], 'kh' => $item['kh']]
            );
        }

        Cache::forget('translations_all');

        return response()->json([
            'message' => 'Translations saved successfully',
        ]);
    }

    public function reset()
    {
        Translation::truncate();
        Cache::forget('translations_all');

        return response()->json([
            'message' => 'Translations reset to system default values successfully',
        ]);
    }
}
