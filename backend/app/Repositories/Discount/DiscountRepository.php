<?php

namespace App\Repositories\Discount;

use App\Interfaces\Discount\DiscountRepositoryInterface;
use App\Models\Discount;
use Carbon\Carbon;

class DiscountRepository implements DiscountRepositoryInterface
{
    public function all(array $filters)
    {
        $query = Discount::with(['product', 'variant']);

        if (!empty($filters['active'])) {
            $now = Carbon::now();
            $query->where('is_active', true)
                  ->where('starts_at', '<=', $now)
                  ->where('ends_at', '>=', $now);
        }

        if (!empty($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (!empty($filters['variant_id'])) {
            $query->where('variant_id', $filters['variant_id']);
        }

        return $query->get();
    }

    public function findById(string $id)
    {
        return Discount::with(['product', 'variant'])->findOrFail($id);
    }

    public function create(array $data)
    {
        return Discount::create($data)->load(['product', 'variant']);
    }

    public function update(string $id, array $data)
    {
        $discount = $this->findById($id);
        $discount->update($data);
        return $discount->load(['product', 'variant']);
    }

    public function delete(string $id)
    {
        $discount = $this->findById($id);
        return $discount->delete();
    }
}
