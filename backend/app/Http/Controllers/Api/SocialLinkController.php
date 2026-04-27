<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SocialLinkController extends Controller
{
    /**
     * GET /api/social-links
     * Public: return all active social links ordered by sort_order.
     */
    public function index()
    {
        $links = SocialLink::active()->ordered()->get();

        return response()->json([
            'data' => $links,
        ]);
    }

    /**
     * GET /api/admin/social-links
     * Admin: return all links (including inactive).
     */
    public function adminIndex()
    {
        $links = SocialLink::ordered()->get();

        return response()->json([
            'data' => $links,
        ]);
    }

    /**
     * POST /api/admin/social-links
     * Admin: create a social link.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'platform'   => 'required|string|max:100',
            'label'      => 'nullable|string|max:100',
            'url'        => 'required|url|max:500',
            'icon'       => 'nullable|string|max:100',
            'is_active'  => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $link = SocialLink::create($request->only(
            'platform', 'label', 'url', 'icon', 'is_active', 'sort_order'
        ));

        return response()->json([
            'message' => 'Social link created',
            'data'    => $link,
        ], 201);
    }

    /**
     * PUT /api/admin/social-links/{id}
     * Admin: update a social link.
     */
    public function update(Request $request, int $id)
    {
        $link = SocialLink::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'platform'   => 'sometimes|string|max:100',
            'label'      => 'nullable|string|max:100',
            'url'        => 'sometimes|url|max:500',
            'icon'       => 'nullable|string|max:100',
            'is_active'  => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $link->update($request->only(
            'platform', 'label', 'url', 'icon', 'is_active', 'sort_order'
        ));

        return response()->json([
            'message' => 'Social link updated',
            'data'    => $link,
        ]);
    }

    /**
     * DELETE /api/admin/social-links/{id}
     * Admin: delete a social link.
     */
    public function destroy(int $id)
    {
        $link = SocialLink::findOrFail($id);
        $link->delete();

        return response()->json([
            'message' => 'Social link deleted',
        ]);
    }
}
