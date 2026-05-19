<?php

namespace App\Services\Discount;

use App\Interfaces\Discount\DiscountRepositoryInterface;
use App\Interfaces\Discount\DiscountServiceInterface;

class DiscountService implements DiscountServiceInterface
{
    protected $discountRepository;

    public function __construct(DiscountRepositoryInterface $discountRepository)
    {
        $this->discountRepository = $discountRepository;
    }

    public function getAllDiscounts(array $filters)
    {
        return $this->discountRepository->all($filters);
    }

    public function getDiscountById(string $id)
    {
        return $this->discountRepository->findById($id);
    }

    public function createDiscount(array $data)
    {
        return $this->discountRepository->create($data);
    }

    public function updateDiscount(string $id, array $data)
    {
        return $this->discountRepository->update($id, $data);
    }

    public function deleteDiscount(string $id)
    {
        return $this->discountRepository->delete($id);
    }
}
