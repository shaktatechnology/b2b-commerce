<?php

namespace App\Interfaces\Order;

use App\Models\Order;

interface OrderRepositoryInterface
{
    public function all(array $filters);
    public function findById(string $id): ?Order;
    public function create(array $data): Order;
    public function update(string $id, array $data): Order;
}
