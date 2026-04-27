<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    /**
     * GET /api/settings
     * Public: return all settings as key=>value map grouped by group.
     */
    public function index()
    {
        $settings = Setting::all()->groupBy('group')->map(function ($items) {
            return $items->pluck('value', 'key');
        });

        return response()->json([
            'data' => $settings,
        ]);
    }

    /**
     * GET /api/settings/{group}
     * Public: return settings for a specific group.
     */
    public function group(string $group)
    {
        $settings = Setting::where('group', $group)
            ->get(['key', 'value', 'label', 'type']);

        return response()->json([
            'data' => $settings->pluck('value', 'key'),
        ]);
    }

    /**
     * PUT /api/admin/settings
     * Admin: bulk upsert settings from a key=>value payload.
     *
     * Body: { "site_name": "My Site", "site_email": "..." }
     */
    public function update(Request $request)
    {
        $settings = $request->all();
        
        foreach ($settings as $key => $value) {
            // Skip numeric keys if any
            if (is_numeric($key)) continue;

            // Handle File Uploads
            if ($request->hasFile($key)) {
                $file = $request->file($key);
                $filename = $key . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('settings', $filename, 'public');
                $value = '/storage/' . $path;
            }

            // Handle Arrays (for multiple emails, phones, tags)
            if (is_array($value)) {
                $value = json_encode($value);
            }

            // Update or Create
            $setting = Setting::where('key' , $key)->first();
            if ($setting) {
                $setting->update(['value' => $value]);
            } else {
                // Guess group from key
                $group = 'general';
                if (str_contains($key, 'meta_')) $group = 'seo';
                if (str_contains($key, 'about_') || str_contains($key, 'mission') || str_contains($key, 'vision')) $group = 'about';
                
                Setting::create([
                    'key' => $key,
                    'value' => $value,
                    'group' => $group,
                    'label' => ucwords(str_replace('_', ' ', $key)),
                    'type' => $request->hasFile($key) ? 'image' : 'text'
                ]);
            }
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }

    /**
     * PUT /api/admin/settings/{key}
     * Admin: update a single setting by key.
     */
    public function updateOne(Request $request, string $key)
    {
        $validator = Validator::make($request->all(), [
            'value' => 'nullable|string|max:5000',
            'label' => 'nullable|string|max:255',
            'group' => 'nullable|string|max:100',
            'type'  => 'nullable|string|in:text,textarea,boolean,image,url,email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $setting = Setting::updateOrCreate(
            ['key' => $key],
            $request->only(['value', 'label', 'group', 'type'])
        );

        return response()->json([
            'message' => 'Setting updated',
            'data'    => $setting,
        ]);
    }
}
