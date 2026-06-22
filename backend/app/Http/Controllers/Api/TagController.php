<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => \App\Models\Tag::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:tags,slug'
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
        }

        $tag = \App\Models\Tag::create($validated);

        return response()->json([
            'message' => 'Tag created successfully',
            'data' => $tag
        ], 201);
    }

    public function show(\App\Models\Tag $tag)
    {
        return response()->json(['data' => $tag]);
    }

    public function update(Request $request, \App\Models\Tag $tag)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|unique:tags,slug,' . $tag->id
        ]);

        $tag->update($validated);

        return response()->json([
            'message' => 'Tag updated successfully',
            'data' => $tag
        ]);
    }

    public function destroy(\App\Models\Tag $tag)
    {
        $tag->delete();
        return response()->json(['message' => 'Tag deleted successfully']);
    }

}
