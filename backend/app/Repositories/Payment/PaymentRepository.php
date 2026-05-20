<?php

namespace App\Repositories\Payment;

use App\Interfaces\Payment\PaymentRepositoryInterface;
use App\Models\Payment;

class PaymentRepository implements PaymentRepositoryInterface
{
    /**
     * Get system payments with advanced filters.
     */
    public function all(array $filters)
    {
        $query = Payment::with(['order.user']);

        if (!empty($filters['order_id'])) {
            $query->where('order_id', $filters['order_id']);
        }

        if (!empty($filters['gateway'])) {
            $query->where('gateway', $filters['gateway']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = $filters['per_page'] ?? 15;
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Find payment by ID.
     */
    public function findById(string $id): ?Payment
    {
        return Payment::with(['order.user'])->find($id);
    }

    /**
     * Find payment by gateway transaction ID.
     */
    public function findByTransactionId(string $transactionId): ?Payment
    {
        return Payment::with(['order.user'])->where('transaction_id', $transactionId)->first();
    }

    /**
     * Create a payment record.
     */
    public function create(array $data): Payment
    {
        return Payment::create($data);
    }

    /**
     * Update a payment record.
     */
    public function update(string $id, array $data): Payment
    {
        $payment = Payment::findOrFail($id);
        $payment->update($data);
        return $payment->load(['order.user']);
    }
}
