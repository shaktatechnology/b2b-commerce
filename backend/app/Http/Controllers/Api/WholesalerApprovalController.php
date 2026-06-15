<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class WholesalerApprovalController extends Controller
{
    public function pending(): JsonResponse
    {
        $wholesalers = User::where('role', 'wholesaler')
            ->where('wholeseller_status', 'pending')
            ->get();

        return response()->json([
            'message' => 'Pending wholesalers retrieved successfully',
            'data' => $wholesalers,
        ]);
    }

    public function approve(User $user): JsonResponse
    {
        if ($user->role !== 'wholesaler') {
            return response()->json([
                'message' => 'Only wholesaler users can be approved.',
            ], 422);
        }

        $user->update([
            'wholeseller_status' => 'approved',
        ]);

        return response()->json([
            'message' => 'Wholesaler approved successfully',
            'data' => $user,
        ]);
    }

    public function reject(User $user): JsonResponse
    {
        if ($user->role !== 'wholesaler') {
            return response()->json([
                'message' => 'Only wholesaler users can be rejected.',
            ], 422);
        }

        $user->update([
            'wholeseller_status' => 'rejected',
        ]);

        return response()->json([
            'message' => 'Wholesaler rejected successfully',
            'data' => $user,
        ]);
    }
}
