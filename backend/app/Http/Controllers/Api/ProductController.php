<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    // GET /api/products - Public
    public function index()
    {
        return response()->json([
            'data' => Product::with('category')->get()
        ]);
    }

    // GET /api/products/{id} - Public
    public function show($id)
    {
        $product = Product::with('category')->find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['data' => $product]);
    }

    // POST /api/products - Admin only
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id'
        ]);

        $product = Product::create($validated);

        return response()->json(['data' => $product], Response::HTTP_CREATED);
    }

    // PUT /api/products/{id} - Admin only
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'image' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id'
        ]);

        $product->update($validated);

        return response()->json(['data' => $product]);
    }

    // DELETE /api/products/{id} - Admin only
    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
