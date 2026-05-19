<?php

namespace App\Interfaces\Discount;

interface DiscountServiceInterface
{
    public function getAllDiscounts(array $filters);
    public function getDiscountById(string $id);
    public function createDiscount(array $data);
    public function updateDiscount(string $id, array $data);
    public function deleteDiscount(string $id);
}
