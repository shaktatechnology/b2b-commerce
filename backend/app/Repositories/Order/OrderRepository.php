<?php

namespace App\Repositories\Order;

use App\Interfaces\Order\OrderRepositoryInterface;
use App\Models\Order;

class OrderRepository implements OrderRepositoryInterface
{
    /**
     * Fetch orders with optional pagination and filtering.
     */
    public function all(array $filters)
    {
        $query = Order::with(['user', 'items.variant.product']);

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (!empty($filters['order_number'])) {
            $query->where('order_number', 'like', '%' . $filters['order_number'] . '%');
        }

        $perPage = $filters['per_page'] ?? 15;
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Find order by ID.
     */
    public function findById(string $id): ?Order
    {
        return Order::with(['user', 'items.variant.product'])->find($id);
    }

    /**
     * Create a new order.
     */
    public function create(array $data): Order
    {
        return Order::create($data);
    }

    /**
     * Update an order.
     */
    public function update(string $id, array $data): Order
    {
        $order = Order::findOrFail($id);
        $order->update($data);
        return $order->load(['user', 'items.variant.product']);
    }
}
