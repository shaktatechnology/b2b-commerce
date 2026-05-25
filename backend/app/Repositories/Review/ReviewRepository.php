<?php

namespace App\Repositories\Review;

use App\Interfaces\Review\ReviewRepositoryInterface;
use App\Models\Review;
use Illuminate\Support\Collection;

class ReviewRepository implements ReviewRepositoryInterface
{
    public function getForProduct(string $productId): Collection
    {
        return Review::with(['user:id,name'])
            ->where('product_id', $productId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findById(string $id): ?Review
    {
        return Review::with(['user:id,name', 'product:id,name,slug'])->find($id);
    }

    public function findByUserAndProduct(string $userId, string $productId): ?Review
    {
        return Review::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();
    }

    public function create(array $data): Review
    {
        return Review::create($data)->load(['user:id,name']);
    }

    public function update(Review $review, array $data): Review
    {
        $review->update($data);
        return $review->load(['user:id,name']);
    }

    public function delete(Review $review): bool
    {
        return $review->delete();
    }

    public function getSummaryForProduct(string $productId): array
    {
        $query = Review::where('product_id', $productId);

        $count = (clone $query)->count();
        $average = $count > 0 ? round((clone $query)->avg('rating'), 1) : 0;

        return [
            'count' => $count,
            'average_rating' => $average,
        ];
    }
}
