<?php

namespace App\Interfaces\Discount;

interface DiscountRepositoryInterface
{
    public function all(array $filters);
    public function findById(string $id);
    public function create(array $data);
    public function update(string $id, array $data);
    public function delete(string $id);
}
