<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Color;
use Illuminate\Http\Request;

class ColorController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Color::orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'hex_code' => 'nullable|string|max:10',
        ]);
        
        $color = Color::create($validated);
        
        return response()->json(['data' => $color], 201);
    }

    public function update(Request $request, Color $color)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'hex_code' => 'nullable|string|max:10',
        ]);
        
        $color->update($validated);
        
        return response()->json(['data' => $color]);
    }

    public function destroy(Color $color)
    {
        $color->delete();
        return response()->json(['message' => 'Color deleted']);
    }
}
