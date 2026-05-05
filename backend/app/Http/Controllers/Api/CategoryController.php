<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    // GET /api/categories - Public
    public function index()
    {
        return response()->json([
            'data' => Category::all()
        ]);
    }

    // GET /api/categories/{id} - Public
    public function show($id)
    {
        $category = Category::with('products')->find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['data' => $category]);
    }

    // POST /api/categories - Admin only
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:categories|max:255',
            'description' => 'nullable|string'
        ]);

        $category = Category::create($validated);

        return response()->json(['data' => $category], Response::HTTP_CREATED);
    }

    // PUT /api/categories/{id} - Admin only
    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|unique:categories,name,' . $id . '|max:255',
            'description' => 'nullable|string'
        ]);

        $category->update($validated);

        return response()->json(['data' => $category]);
    }

    // DELETE /api/categories/{id} - Admin only
    public function destroy($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], Response::HTTP_NOT_FOUND);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
