<?php

namespace App\Interfaces\Coupon;

use App\Models\Coupon;
use Illuminate\Support\Collection;

interface CouponRepositoryInterface
{
    public function all(array $filters);

    public function findById(string $id): ?Coupon;

    public function findByCode(string $code): ?Coupon;

    public function create(array $data): Coupon;

    public function update(string $id, array $data): Coupon;

    public function delete(string $id): bool;

    public function syncRegionRules(Coupon $coupon, array $rules): Coupon;

    public function syncRestrictions(Coupon $coupon, array $relations): Coupon;

    public function getRedemptions(string $couponId): Collection;
}
