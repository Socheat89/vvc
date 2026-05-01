<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'VVC API Backend. Visit http://localhost:3000 for the frontend.']);
});
