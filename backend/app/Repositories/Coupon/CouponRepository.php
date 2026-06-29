<?php

namespace App\Repositories\Coupon;

use App\Interfaces\Coupon\CouponRepositoryInterface;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use Illuminate\Support\Collection;

class CouponRepository implements CouponRepositoryInterface
{
    public function all(array $filters)
    {
        $query = Coupon::with(['creator', 'regionRules', 'products', 'categories', 'brands', 'users'])
            ->withCount('redemptions');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', '%' . $search . '%')
                    ->orWhere('customer_code', 'like', '%' . $search . '%');
            });
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findById(string $id): ?Coupon
    {
        return Coupon::with(['creator', 'regionRules', 'products', 'categories', 'brands', 'users'])->find($id);
    }

    public function findByCode(string $code): ?Coupon
    {
        $code = strtoupper(trim($code));

        return Coupon::with(['creator', 'regionRules', 'products', 'categories', 'brands', 'users'])
            ->where(function ($query) use ($code) {
                $query->where('customer_code', $code)
                    ->orWhere('secure_code', $code);
            })
            ->first();
    }

    public function create(array $data): Coupon
    {
        return Coupon::create($data);
    }

    public function update(string $id, array $data): Coupon
    {
        $coupon = $this->findById($id);

        if (!$coupon) {
            abort(404, 'Coupon not found.');
        }

        $coupon->update($data);

        return $coupon->fresh(['creator', 'regionRules', 'products', 'categories', 'brands', 'users']);
    }

    public function delete(string $id): bool
    {
        $coupon = $this->findById($id);

        if (!$coupon) {
            abort(404, 'Coupon not found.');
        }

        return (bool) $coupon->delete();
    }

    public function syncRegionRules(Coupon $coupon, array $rules): Coupon
    {
        $coupon->regionRules()->delete();

        foreach ($rules as $rule) {
            $rule['minimum_subtotal'] = $rule['minimum_subtotal'] ?? 0;
            $rule['free_shipping'] = $rule['free_shipping'] ?? false;

            $coupon->regionRules()->create($rule);
        }

        return $coupon->fresh(['creator', 'regionRules', 'products', 'categories', 'brands', 'users']);
    }

    public function syncRestrictions(Coupon $coupon, array $relations): Coupon
    {
        if (array_key_exists('product_ids', $relations) && $relations['product_ids'] !== null) {
            $coupon->products()->sync($relations['product_ids'] ?? []);
        }

        if (array_key_exists('category_ids', $relations) && $relations['category_ids'] !== null) {
            $coupon->categories()->sync($relations['category_ids'] ?? []);
        }

        if (array_key_exists('brand_ids', $relations) && $relations['brand_ids'] !== null) {
            $coupon->brands()->sync($relations['brand_ids'] ?? []);
        }

        if (array_key_exists('user_ids', $relations) && $relations['user_ids'] !== null) {
            $coupon->users()->sync($relations['user_ids'] ?? []);
        }

        return $coupon->fresh(['creator', 'regionRules', 'products', 'categories', 'brands', 'users']);
    }

    public function getRedemptions(string $couponId): Collection
    {
        return CouponRedemption::with(['user', 'order'])
            ->where('coupon_id', $couponId)
            ->orderBy('redeemed_at', 'desc')
            ->get();
    }
}
