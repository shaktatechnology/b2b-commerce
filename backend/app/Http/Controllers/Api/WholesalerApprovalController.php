<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class WholesalerApprovalController extends Controller
{
    public function pending(): JsonResponse
    {
        $wholesalers = User::query()
            ->where('role', 'wholesaler')
            ->where('approval_state', 'pending')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => $wholesalers,
        ]);
    }

    public function approve(User $user): JsonResponse
    {
        return $this->setApprovalState($user, 'approved', 'Wholesaler approved successfully');
    }

    public function reject(User $user): JsonResponse
    {
        return $this->setApprovalState($user, 'rejected', 'Wholesaler rejected successfully');
    }

    private function setApprovalState(User $user, string $state, string $message): JsonResponse
    {
        if ($user->role !== 'wholesaler') {
            return response()->json([
                'message' => 'Only wholesalers can be approved or rejected',
            ], 422);
        }

        $user->update(['approval_state' => $state]);

        return response()->json([
            'message' => $message,
            'data' => $user->refresh(),
        ]);
    }
}
