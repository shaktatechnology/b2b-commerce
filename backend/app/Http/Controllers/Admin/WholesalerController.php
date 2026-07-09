<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Interfaces\WholesalerServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WholesalerController extends Controller
{
    protected $wholesalerService;

    public function __construct(WholesalerServiceInterface $wholesalerService)
    {
        $this->wholesalerService = $wholesalerService;
    }

    /**
     * Get all wholesalers with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'status' => $request->query('status', 'all'),
            'search' => $request->query('search', ''),
        ];

        $wholesalers = $this->wholesalerService->getAllWholesalers($filters);

        return response()->json([
            'success' => true,
            'data' => $wholesalers,
        ]);
    }

    /**
     * Get pending wholesaler applications.
     */
    public function pending(): JsonResponse
    {
        $wholesalers = $this->wholesalerService->getPendingWholesalers();

        return response()->json([
            'success' => true,
            'data' => $wholesalers,
        ]);
    }

    /**
     * Approve a wholesaler account.
     */
    public function approve(string $id): JsonResponse
    {
        $user = $this->wholesalerService->approveWholesaler($id);

        return response()->json([
            'success' => true,
            'message' => 'Wholesaler approved successfully',
            'data' => $user,
        ]);
    }

    /**
     * Reject a wholesaler account.
     */
    public function reject(string $id): JsonResponse
    {
        $user = $this->wholesalerService->rejectWholesaler($id);

        return response()->json([
            'success' => true,
            'message' => 'Wholesaler rejected successfully',
            'data' => $user,
        ]);
    }
}
