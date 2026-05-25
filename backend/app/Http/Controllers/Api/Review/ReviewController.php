<?php

namespace App\Http\Controllers\Api\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Review\CreateReviewRequest;
use App\Http\Requests\Api\Review\UpdateReviewRequest;
use App\Interfaces\Review\ReviewServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(protected ReviewServiceInterface $reviewService) {}

    protected function productFilters(Request $request): array
    {
        $filters = [];
        if (!$request->user() || $request->user()->role !== 'admin') {
            $filters['active'] = true;
        }
        return $filters;
    }

    public function index(Request $request, string $slug): JsonResponse
    {
        $data = $this->reviewService->listProductReviews(
            $slug,
            $this->productFilters($request)
        );

        return response()->json(['data' => $data]);
    }

    public function myReview(Request $request, string $slug): JsonResponse
    {
        $review = $this->reviewService->getUserReviewForProduct(
            $request->user()->id,
            $slug,
            $this->productFilters($request)
        );

        return response()->json(['data' => $review]);
    }

    public function canReview(Request $request, string $slug): JsonResponse
    {
        $data = $this->reviewService->canUserReviewProduct(
            $request->user()->id,
            $slug,
            $this->productFilters($request)
        );

        return response()->json(['data' => $data]);
    }

    public function store(CreateReviewRequest $request, string $slug): JsonResponse
    {
        try {
            $review = $this->reviewService->createReview(
                $request->user()->id,
                $slug,
                $request->only(['rating', 'message']),
                $this->productFilters($request)
            );

            return response()->json([
                'message' => 'Review submitted successfully',
                'data' => $review,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function update(UpdateReviewRequest $request, string $slug, string $id): JsonResponse
    {
        try {
            $review = $this->reviewService->updateReview(
                $request->user()->id,
                $id,
                $request->only(['rating', 'message'])
            );

            return response()->json([
                'message' => 'Review updated successfully',
                'data' => $review,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroy(Request $request, string $slug, string $id): JsonResponse
    {
        $this->reviewService->deleteReview($request->user()->id, $id);

        return response()->json(['message' => 'Review deleted successfully']);
    }
}
