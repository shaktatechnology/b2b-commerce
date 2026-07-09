<?php

namespace App\Services\Coupon;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CouponValidationService
{
    public function validateCoupon(array $payload, ?User $user = null): array
    {
        $code = strtoupper(trim((string) ($payload['code'] ?? $payload['customer_code'] ?? '')));

        if ($code === '') {
            return $this->failure('Coupon code is required.');
        }

        $couponQuery = Coupon::with(['regionRules', 'products', 'categories', 'brands', 'users', 'redemptions', 'creator'])
            ->where(function ($query) use ($code) {
                $query->where('customer_code', $code)
                    ->orWhere('secure_code', $code);
            });

        if (DB::transactionLevel() > 0) {
            $couponQuery->lockForUpdate();
        }

        $coupon = $couponQuery->first();

        if (!$coupon) {
            return $this->failure('Coupon does not exist.');
        }

        if ($coupon->status !== 'active') {
            return $this->failure('Coupon is inactive.');
        }

        if ($coupon->starts_at && $coupon->starts_at->isFuture()) {
            return $this->failure('Coupon has not started yet.');
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            return $this->failure('Coupon has expired.');
        }

        if ($coupon->usage_limit !== null && $coupon->redemptions()->count() >= $coupon->usage_limit) {
            return $this->failure('Coupon usage limit has been reached.');
        }

        if (!$user && $this->requiresAuthenticatedCustomer($coupon)) {
            return $this->failure('Authentication is required to validate this coupon.');
        }

        if ($user) {
            if ($coupon->usage_per_user !== null && $coupon->redemptions()->where('user_id', $user->id)->count() >= $coupon->usage_per_user) {
                return $this->failure('Coupon usage limit for this customer has been reached.');
            }

            if ($coupon->first_order_only && $user->orders()->exists()) {
                return $this->failure('Coupon is available only for first orders.');
            }

            if ($coupon->customer_type && !$this->matchesCustomerType($coupon->customer_type, $user)) {
                return $this->failure('Coupon is not available for this customer type.');
            }

            if ($coupon->users->isNotEmpty() && !$coupon->users->contains('id', $user->id)) {
                return $this->failure('Coupon is restricted to specific customers.');
            }
        }

        $shippingAddress = (array) ($payload['shipping_address'] ?? []);
        $market = $this->resolveMarket($shippingAddress);
        $currency = $this->resolveCurrency($market);
        $subtotal = (float) ($payload['subtotal'] ?? 0);
        $items = $payload['items'] ?? [];

        $regionRule = $coupon->regionRules->first(function ($rule) use ($market, $currency) {
            return $rule->market === $market && $rule->currency === $currency;
        });

        if (!$regionRule) {
            return $this->failure('Coupon is not valid for the selected market or currency.');
        }

        if ($subtotal < (float) $regionRule->minimum_subtotal) {
            return $this->failure('Cart subtotal does not meet the minimum required amount.');
        }

        if (!$this->passesRestrictionChecks($coupon, $items)) {
            return $this->failure('Coupon is not applicable to the selected items.');
        }

        $discountAmount = $this->calculateDiscountAmount($regionRule, $subtotal);

        return [
            'success' => true,
            'message' => 'Coupon validated successfully.',
            'data' => [
                'coupon_id' => $coupon->id,
                'customer_code' => $coupon->customer_code,
                'discount_amount' => number_format($discountAmount, 2, '.', ''),
                'applied_rule' => [
                    'market' => $regionRule->market,
                    'currency' => $regionRule->currency,
                    'discount_type' => $regionRule->discount_type,
                    'discount_value' => number_format((float) $regionRule->discount_value, 2, '.', ''),
                    'minimum_subtotal' => number_format((float) $regionRule->minimum_subtotal, 2, '.', ''),
                    'maximum_discount' => $regionRule->maximum_discount !== null ? number_format((float) $regionRule->maximum_discount, 2, '.', '') : null,
                    'free_shipping' => (bool) $regionRule->free_shipping,
                ],
            ],
        ];
    }

    protected function failure(string $message): array
    {
        return [
            'success' => false,
            'message' => $message,
        ];
    }

    protected function resolveMarket(array $shippingAddress): string
    {
        $country = strtoupper(trim((string) ($shippingAddress['country'] ?? '')));

        if (in_array($country, ['NP', 'NPL', 'NEPAL'], true)) {
            return 'NP';
        }

        return 'INT';
    }

    protected function resolveCurrency(string $market): string
    {
        return $market === 'NP' ? 'NPR' : 'USD';
    }

    protected function calculateDiscountAmount(object $rule, float $subtotal): float
    {
        $discountAmount = $rule->discount_type === 'percentage'
            ? round($subtotal * ((float) $rule->discount_value / 100), 2)
            : (float) $rule->discount_value;

        if ($rule->maximum_discount !== null) {
            $discountAmount = min($discountAmount, (float) $rule->maximum_discount);
        }

        return min($discountAmount, $subtotal);
    }

    protected function matchesCustomerType(string $customerType, User $user): bool
    {
        $customerType = strtolower($customerType);

        if ($customerType === 'all') {
            return true;
        }

        if ($customerType === 'wholesale') {
            return in_array($user->role, ['wholesaler', 'wholeseller'], true);
        }

        if ($customerType === 'retail') {
            return !in_array($user->role, ['wholesaler', 'wholeseller'], true);
        }

        return $customerType === strtolower((string) $user->role);
    }

    protected function requiresAuthenticatedCustomer(Coupon $coupon): bool
    {
        $customerType = strtolower((string) $coupon->customer_type);

        return $coupon->usage_per_user !== null
            || $coupon->first_order_only
            || ($coupon->customer_type !== null && $customerType !== 'all')
            || $coupon->users->isNotEmpty();
    }

    protected function passesRestrictionChecks(Coupon $coupon, array $items): bool
    {
        if ($coupon->products->isEmpty() && $coupon->categories->isEmpty() && $coupon->brands->isEmpty()) {
            return true;
        }

        foreach ($items as $item) {
            $productId = $item['product_id'] ?? null;
            $categoryIds = $item['category_ids'] ?? [];
            $brandId = $item['brand_id'] ?? null;

            if ($productId && $coupon->products->contains('id', $productId)) {
                return true;
            }

            if ($brandId && $coupon->brands->contains('id', $brandId)) {
                return true;
            }

            if (!empty($categoryIds) && $coupon->categories->whereIn('id', $categoryIds)->isNotEmpty()) {
                return true;
            }
        }

        return false;
    }
}
