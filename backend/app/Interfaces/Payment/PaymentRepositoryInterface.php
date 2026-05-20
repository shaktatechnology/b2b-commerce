<?php

namespace App\Interfaces\Payment;

use App\Models\Payment;

interface PaymentRepositoryInterface
{
    public function all(array $filters);
    public function findById(string $id): ?Payment;
    public function findByTransactionId(string $transactionId): ?Payment;
    public function create(array $data): Payment;
    public function update(string $id, array $data): Payment;
}
