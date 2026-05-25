<?php

namespace App\Services\Review;

use App\Interfaces\ProductServiceInterface;
use App\Interfaces\Review\ReviewRepositoryInterface;
use App\Interfaces\Review\ReviewServiceInterface;
use App\Models\Order;
use App\Models\Review;

class ReviewService implements ReviewServiceInterface
{
    public function __construct(
        protected ReviewRepositoryInterface $reviewRepository,
        protected ProductServiceInterface $productService
    ) {}

    public function listProductReviews(string $productIdentifier, array $productFilters = []): array
    {
        $product = $this->productService->resolveProduct($productIdentifier, $productFilters);
        $reviews = $this->reviewRepository->getForProduct($product->id);
        $summary = $this->reviewRepository->getSummaryForProduct($product->id);

        return [
            'product_id' => $product->id,
            'summary' => $summary,
            'reviews' => $reviews,
        ];
    }

    public function getUserReviewForProduct(
        string $userId,
        string $productIdentifier,
        array $productFilters = []
    ): ?Review {
        $product = $this->productService->resolveProduct($productIdentifier, $productFilters);

        return $this->reviewRepository->findByUserAndProduct($userId, $product->id);
    }

    public function canUserReviewProduct(
        string $userId,
        string $productIdentifier,
        array $productFilters = []
    ): array {
        $product = $this->productService->resolveProduct($productIdentifier, $productFilters);
        $existing = $this->reviewRepository->findByUserAndProduct($userId, $product->id);
        $hasPurchased = $this->userHasCompletedPurchase($userId, $product->id);

        return [
            'can_review' => $hasPurchased && $existing === null,
            'has_purchased' => $hasPurchased,
            'has_reviewed' => $existing !== null,
            'existing_review_id' => $existing?->id,
        ];
    }

    public function createReview(
        string $userId,
        string $productIdentifier,
        array $data,
        array $productFilters = []
    ): Review {
        $product = $this->productService->resolveProduct($productIdentifier, $productFilters);

        if ($this->reviewRepository->findByUserAndProduct($userId, $product->id)) {
            throw new \Exception('You have already reviewed this product.');
        }

        if (!$this->userHasCompletedPurchase($userId, $product->id)) {
            throw new \Exception('You can only review products you have fully purchased.');
        }

        return $this->reviewRepository->create([
            'user_id' => $userId,
            'product_id' => $product->id,
            'rating' => $data['rating'],
            'message' => $data['message'],
        ]);
    }

    public function updateReview(string $userId, string $reviewId, array $data): Review
    {
        $review = $this->reviewRepository->findById($reviewId);

        if (!$review || $review->user_id !== $userId) {
            abort(404, 'Review not found.');
        }

        return $this->reviewRepository->update($review, [
            'rating' => $data['rating'] ?? $review->rating,
            'message' => $data['message'] ?? $review->message,
        ]);
    }

    public function deleteReview(string $userId, string $reviewId): bool
    {
        $review = $this->reviewRepository->findById($reviewId);

        if (!$review || $review->user_id !== $userId) {
            abort(404, 'Review not found.');
        }

        return $this->reviewRepository->delete($review);
    }

    protected function userHasCompletedPurchase(string $userId, string $productId): bool
    {
        return Order::where('user_id', $userId)
            ->where('payment_status', 'paid')
            ->whereHas('items.variant', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->exists();
    }
}
