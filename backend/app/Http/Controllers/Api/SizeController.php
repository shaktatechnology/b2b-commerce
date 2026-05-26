<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Size;
use Illuminate\Http\Request;

class SizeController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Size::orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        
        $size = Size::create($validated);
        
        return response()->json(['data' => $size], 201);
    }

    public function update(Request $request, Size $size)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
        ]);
        
        $size->update($validated);
        
        return response()->json(['data' => $size]);
    }

    public function destroy(Size $size)
    {
        $size->delete();
        return response()->json(['message' => 'Size deleted']);
    }
}
