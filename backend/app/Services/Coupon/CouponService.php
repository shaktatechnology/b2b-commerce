<?php

namespace App\Services\Coupon;

use App\Interfaces\Coupon\CouponRepositoryInterface;
use App\Interfaces\Coupon\CouponServiceInterface;
use App\Models\Coupon;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CouponService implements CouponServiceInterface
{
    public function __construct(
        protected CouponRepositoryInterface $couponRepository,
        protected CouponValidationService $couponValidationService
    ) {
    }

    public function all(array $filters)
    {
        return $this->couponRepository->all($filters);
    }

    public function findById(string $id): ?Coupon
    {
        return $this->couponRepository->findById($id);
    }

    public function createCoupon(array $data, User $creator): Coupon
    {
        return DB::transaction(function () use ($data, $creator) {
            $coupon = $this->couponRepository->create([
                'name' => $data['name'],
                'customer_code' => $data['coupon_code'] ?? $data['customer_code'] ?? null,
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'active',
                'promotion_type' => $data['promotion_type'] ?? 'standard',
                'auto_apply' => $data['auto_apply'] ?? false,
                'starts_at' => $data['starts_at'] ?? null,
                'expires_at' => $data['expires_at'] ?? null,
                'usage_limit' => $data['usage_limit'] ?? null,
                'usage_per_user' => $data['usage_per_user'] ?? null,
                'stackable' => $data['stackable'] ?? false,
                'first_order_only' => $data['first_order_only'] ?? false,
                'customer_type' => $data['customer_type'] ?? null,
                'payment_methods' => $data['payment_methods'] ?? null,
                'bogo_config' => $data['bogo_config'] ?? null,
                'tier_config' => $data['tier_config'] ?? null,
                'created_by' => $creator->id,
            ]);

            $this->couponRepository->syncRegionRules($coupon, $data['region_rules'] ?? []);
            $this->couponRepository->syncRestrictions($coupon, [
                'product_ids' => $data['product_ids'] ?? [],
                'category_ids' => $data['category_ids'] ?? [],
                'brand_ids' => $data['brand_ids'] ?? [],
                'user_ids' => $data['user_ids'] ?? [],
            ]);

            return $coupon->fresh(['creator', 'regionRules', 'products', 'categories', 'brands', 'users']);
        });
    }

    public function updateCoupon(string $id, array $data): Coupon
    {
        return DB::transaction(function () use ($id, $data) {
            if (array_key_exists('coupon_code', $data)) {
                $data['customer_code'] = $data['coupon_code'];
            }

            $couponFields = [
                'name',
                'customer_code',
                'description',
                'status',
                'promotion_type',
                'auto_apply',
                'starts_at',
                'expires_at',
                'usage_limit',
                'usage_per_user',
                'stackable',
                'first_order_only',
                'customer_type',
                'payment_methods',
                'bogo_config',
                'tier_config',
            ];

            $coupon = $this->couponRepository->update(
                $id,
                array_intersect_key($data, array_flip($couponFields))
            );

            if (array_key_exists('region_rules', $data)) {
                $coupon = $this->couponRepository->syncRegionRules($coupon, $data['region_rules'] ?? []);
            }

            $coupon = $this->couponRepository->syncRestrictions($coupon, [
                'product_ids' => $data['product_ids'] ?? null,
                'category_ids' => $data['category_ids'] ?? null,
                'brand_ids' => $data['brand_ids'] ?? null,
                'user_ids' => $data['user_ids'] ?? null,
            ]);

            return $coupon;
        });
    }

    public function deleteCoupon(string $id): bool
    {
        return $this->couponRepository->delete($id);
    }

    public function toggleStatus(string $id, string $status): Coupon
    {
        return $this->couponRepository->update($id, ['status' => $status]);
    }

    public function generateCustomerCode(int $length = Coupon::CUSTOMER_CODE_LENGTH): string
    {
        return Coupon::generateCustomerCode($length);
    }

    public function getRedemptions(string $couponId): Collection
    {
        return $this->couponRepository->getRedemptions($couponId);
    }

    public function validateCoupon(array $payload, ?User $user = null): array
    {
        return $this->couponValidationService->validateCoupon($payload, $user);
    }
}
