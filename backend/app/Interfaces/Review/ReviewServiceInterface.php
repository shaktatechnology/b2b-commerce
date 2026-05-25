<?php

namespace App\Interfaces\Review;

use App\Models\Review;
use Illuminate\Support\Collection;

interface ReviewServiceInterface
{
    public function listProductReviews(string $productIdentifier, array $productFilters = []): array;

    public function getUserReviewForProduct(string $userId, string $productIdentifier, array $productFilters = []): ?Review;

    public function canUserReviewProduct(string $userId, string $productIdentifier, array $productFilters = []): array;

    public function createReview(string $userId, string $productIdentifier, array $data, array $productFilters = []): Review;

    public function updateReview(string $userId, string $reviewId, array $data): Review;

    public function deleteReview(string $userId, string $reviewId): bool;
}
