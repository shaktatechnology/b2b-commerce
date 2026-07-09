<?php

namespace App\Interfaces\Coupon;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Support\Collection;

interface CouponServiceInterface
{
    public function all(array $filters);

    public function findById(string $id): ?Coupon;

    public function createCoupon(array $data, User $creator): Coupon;

    public function updateCoupon(string $id, array $data): Coupon;

    public function deleteCoupon(string $id): bool;

    public function toggleStatus(string $id, string $status): Coupon;

    public function generateCustomerCode(int $length = Coupon::CUSTOMER_CODE_LENGTH): string;

    public function getRedemptions(string $couponId): Collection;

    public function validateCoupon(array $payload, ?User $user = null): array;
}
