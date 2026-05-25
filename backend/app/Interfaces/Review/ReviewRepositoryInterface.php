<?php

namespace App\Interfaces\Review;

use App\Models\Review;
use Illuminate\Support\Collection;

interface ReviewRepositoryInterface
{
    public function getForProduct(string $productId): Collection;

    public function findById(string $id): ?Review;

    public function findByUserAndProduct(string $userId, string $productId): ?Review;

    public function create(array $data): Review;

    public function update(Review $review, array $data): Review;

    public function delete(Review $review): bool;

    public function getSummaryForProduct(string $productId): array;
}
