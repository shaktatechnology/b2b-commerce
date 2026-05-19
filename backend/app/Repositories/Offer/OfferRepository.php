<?php

namespace App\Repositories\Offer;

use App\Interfaces\Offer\OfferRepositoryInterface;
use App\Models\Offer;
use Carbon\Carbon;

class OfferRepository implements OfferRepositoryInterface
{
    public function all(array $filters)
    {
        $query = Offer::with('products');

        if (!empty($filters['active'])) {
            $now = Carbon::now();
            $query->where('is_active', true)
                  ->where(function ($q) use ($now) {
                      $q->whereNull('starts_at')
                        ->orWhere('starts_at', '<=', $now);
                  })
                  ->where(function ($q) use ($now) {
                      $q->whereNull('ends_at')
                        ->orWhere('ends_at', '>=', $now);
                  });
        }

        if (!empty($filters['placement'])) {
            $query->where('placement', $filters['placement']);
        }

        return $query->get();
    }

    public function findById(string $id)
    {
        return Offer::with('products')->findOrFail($id);
    }

    public function create(array $data)
    {
        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);

        $offer = Offer::create($data);
        if (!empty($productIds)) {
            $offer->products()->sync($productIds);
        }

        return $offer->load('products');
    }

    public function update(string $id, array $data)
    {
        $offer = $this->findById($id);

        $productIds = null;
        if (array_key_exists('product_ids', $data)) {
            $productIds = $data['product_ids'] ?? [];
            unset($data['product_ids']);
        }

        $offer->update($data);

        if ($productIds !== null) {
            $offer->products()->sync($productIds);
        }

        return $offer->load('products');
    }

    public function delete(string $id)
    {
        $offer = $this->findById($id);
        return $offer->delete();
    }
}
