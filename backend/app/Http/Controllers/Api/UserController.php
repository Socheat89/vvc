<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $users = \Illuminate\Support\Facades\Cache::remember('users_all', 300, function () {
            return User::orderBy('created_at', 'desc')->get();
        });
        return response()->json(['data' => $users]);
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json(['data' => $user]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string|in:admin,user',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'user',
        ]);

        \Illuminate\Support\Facades\Cache::forget('users_all');

        return response()->json(['data' => $user], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string|in:admin,user',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        if (isset($validated['role'])) {
            $user->role = $validated['role'];
        }
        
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        \Illuminate\Support\Facades\Cache::forget('users_all');

        return response()->json(['data' => $user]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        if (auth()->id() == $id) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $user->delete();

        \Illuminate\Support\Facades\Cache::forget('users_all');

        return response()->json(null, 204);
    }
}
