<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;

class DashboardStatisticsController extends Controller
{
    public function __invoke(AnalyticsService $analyticsService): JsonResponse
    {
        return response()->json([
            'message' => 'Dashboard statistics retrieved successfully',
            'data' => $analyticsService->dashboardStatistics(),
        ]);
    }
}
