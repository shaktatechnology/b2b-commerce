<?php

namespace App\Services\Coupon;

use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CouponValidationService
{
    private const COUPON_RELATIONS = ['regionRules', 'products', 'categories', 'brands', 'users', 'redemptions', 'creator'];
    private const WHOLESALER_ROLES = ['wholesaler', 'wholeseller', 'wholesale'];

    public function validateCoupon(array $payload, ?User $user = null): array
    {
        $code = strtoupper(trim((string) ($payload['coupon_code'] ?? $payload['code'] ?? $payload['customer_code'] ?? '')));

        if ($code === '') {
            return $this->failure('Coupon code is required.');
        }

        $couponQuery = $this->couponQuery()
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

        return $this->validateLoadedCoupon($coupon, $payload, $user);
    }

    public function validateBestAutoPromotion(array $payload, ?User $user = null, ?string $excludeCouponId = null): array
    {
        $couponQuery = $this->couponQuery()
            ->where(function ($query) {
                $query->where('auto_apply', true)
                    ->orWhere('promotion_type', 'auto');
            })
            ->orderByDesc('created_at');

        if ($excludeCouponId !== null) {
            $couponQuery->where('id', '!=', $excludeCouponId);
        }

        if (DB::transactionLevel() > 0) {
            $couponQuery->lockForUpdate();
        }

        $bestResult = null;
        $bestDiscount = -1.0;

        foreach ($couponQuery->get() as $coupon) {
            $result = $this->validateLoadedCoupon($coupon, $payload, $user);

            if (!($result['success'] ?? false)) {
                continue;
            }

            $discount = (float) ($result['data']['discount_amount'] ?? 0);

            if ($discount <= 0 && !($result['data']['applied_rule']['free_shipping'] ?? false)) {
                continue;
            }

            if ($discount > $bestDiscount) {
                $bestResult = $result;
                $bestDiscount = $discount;
            }
        }

        if ($bestResult === null) {
            return $this->failure('No auto promotion is applicable.');
        }

        $bestResult['data']['auto_applied'] = true;

        return $bestResult;
    }

    protected function validateLoadedCoupon(Coupon $coupon, array $payload, ?User $user = null): array
    {
        if ($coupon->status !== 'active') {
            return $this->failure('Coupon is inactive.');
        }

        if ($coupon->starts_at && $coupon->starts_at->isFuture()) {
            return $this->failure('Coupon has not started yet.');
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            return $this->failure('Coupon has expired.');
        }

        if ($coupon->usage_limit !== null && $this->redemptionCount($coupon) >= $coupon->usage_limit) {
            return $this->failure('Coupon usage limit has been reached.');
        }

        if (!$user && $this->requiresAuthenticatedCustomer($coupon)) {
            return $this->failure('Authentication is required to validate this coupon.');
        }

        if ($user) {
            if ($coupon->usage_per_user !== null && $this->redemptionCountForUser($coupon, $user) >= $coupon->usage_per_user) {
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
        $currency = $this->resolveCurrency($payload, $market);
        $subtotal = (float) ($payload['subtotal'] ?? 0);
        $items = $payload['items'] ?? [];
        $customerType = $this->resolveUserCustomerType($user);

        if (!$this->passesPaymentMethodCheck($coupon, $payload['payment_method'] ?? null)) {
            return $this->failure('Coupon is not valid for the selected payment method.');
        }

        $ruleSelection = $this->selectRegionRule($coupon, $market, $currency, $customerType);

        if (!($ruleSelection['success'] ?? false)) {
            return $this->failure($ruleSelection['message']);
        }

        $regionRule = $ruleSelection['rule'];

        if ($subtotal < (float) $regionRule->minimum_subtotal) {
            return $this->failure('Cart subtotal does not meet the minimum required amount.');
        }

        if (!$this->passesRestrictionChecks($coupon, $items)) {
            return $this->failure('Coupon is not applicable to the selected items.');
        }

        $promotionResult = $this->calculatePromotionDiscount($coupon, $regionRule, $subtotal, (array) $items);

        if (!($promotionResult['eligible'] ?? false)) {
            return $this->failure($promotionResult['message'] ?? 'Coupon is not applicable to the selected items.');
        }

        $discountAmount = min((float) $promotionResult['discount_amount'], $subtotal);

        return [
            'success' => true,
            'message' => 'Coupon validated successfully.',
            'data' => [
                'coupon_id' => $coupon->id,
                'coupon_code' => $coupon->customer_code,
                'promotion_type' => $coupon->promotion_type ?? 'standard',
                'auto_apply' => $this->isAutoPromotion($coupon),
                'stackable' => (bool) $coupon->stackable,
                'discount_amount' => number_format($discountAmount, 2, '.', ''),
                'applied_rule' => [
                    'market' => $regionRule->market,
                    'currency' => $regionRule->currency,
                    'customer_type' => $regionRule->customer_type,
                    'discount_type' => $regionRule->discount_type,
                    'discount_value' => number_format((float) $regionRule->discount_value, 2, '.', ''),
                    'minimum_subtotal' => number_format((float) $regionRule->minimum_subtotal, 2, '.', ''),
                    'maximum_discount' => $regionRule->maximum_discount !== null ? number_format((float) $regionRule->maximum_discount, 2, '.', '') : null,
                    'free_shipping' => (bool) $regionRule->free_shipping,
                ],
                'applied_promotion' => [
                    'discount_strategy' => $promotionResult['strategy'] ?? 'standard',
                    'payment_methods' => $coupon->payment_methods ?? [],
                    'config' => $promotionResult['applied_config'] ?? null,
                ],
            ],
        ];
    }

    protected function couponQuery()
    {
        return Coupon::with(self::COUPON_RELATIONS);
    }

    protected function redemptionCount(Coupon $coupon): int
    {
        return CouponRedemption::where('coupon_id', $coupon->id)->count();
    }

    protected function redemptionCountForUser(Coupon $coupon, User $user): int
    {
        return CouponRedemption::where('coupon_id', $coupon->id)
            ->where('user_id', $user->id)
            ->count();
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

    protected function resolveCurrency(array $payload, string $market): string
    {
        if (array_key_exists('currency', $payload) && trim((string) $payload['currency']) !== '') {
            return strtoupper(trim((string) $payload['currency']));
        }

        return $market === 'NP' ? 'NPR' : 'USD';
    }

    protected function selectRegionRule(Coupon $coupon, string $market, string $currency, ?string $customerType): array
    {
        $matchingMarketCurrencyRules = $coupon->regionRules->filter(function ($rule) use ($market, $currency) {
            return $rule->market === $market && strtoupper((string) $rule->currency) === $currency;
        });

        if ($matchingMarketCurrencyRules->isEmpty()) {
            return [
                'success' => false,
                'message' => 'This coupon is not valid for the selected currency or market.',
            ];
        }

        $genericRule = $matchingMarketCurrencyRules->first(function ($rule) {
            return $this->isGenericRuleCustomerType($rule->customer_type ?? null);
        });

        if ($customerType !== null) {
            $specificRule = $matchingMarketCurrencyRules->first(function ($rule) use ($customerType) {
                return $this->normalizeCustomerType($rule->customer_type ?? null) === $customerType;
            });

            if ($specificRule) {
                return [
                    'success' => true,
                    'rule' => $specificRule,
                ];
            }

            if ($genericRule) {
                return [
                    'success' => true,
                    'rule' => $genericRule,
                ];
            }

            return [
                'success' => false,
                'message' => 'Coupon is not valid for this customer type.',
            ];
        }

        if ($genericRule) {
            return [
                'success' => true,
                'rule' => $genericRule,
            ];
        }

        return [
            'success' => false,
            'message' => 'Authentication is required to validate this coupon.',
        ];
    }

    protected function isGenericRuleCustomerType($customerType): bool
    {
        return $this->normalizeCustomerType($customerType) === null;
    }

    protected function calculateDiscountAmount(object $rule, float $subtotal): float
    {
        if ($rule->discount_type === 'percentage') {
            $discountAmount = round($subtotal * ((float) $rule->discount_value / 100), 2);

            if ($rule->maximum_discount !== null) {
                $discountAmount = min($discountAmount, (float) $rule->maximum_discount);
            }
        } else {
            $discountAmount = (float) $rule->discount_value;
        }

        return min($discountAmount, $subtotal);
    }

    protected function calculatePromotionDiscount(Coupon $coupon, object $regionRule, float $subtotal, array $items): array
    {
        $strategy = $this->resolveDiscountStrategy($coupon);

        if ($strategy === 'bogo') {
            return $this->calculateBogoPromotion($coupon, $items, $subtotal);
        }

        if ($strategy === 'tiered') {
            return $this->calculateTieredPromotion($coupon, $regionRule, $subtotal);
        }

        return [
            'eligible' => true,
            'discount_amount' => $this->calculateDiscountAmount($regionRule, $subtotal),
            'strategy' => 'standard',
            'applied_config' => null,
        ];
    }

    protected function calculateBogoPromotion(Coupon $coupon, array $items, float $subtotal): array
    {
        $config = $coupon->bogo_config ?? [];
        $buyQuantity = max(1, (int) ($config['buy_quantity'] ?? $config['buy'] ?? 1));
        $getQuantity = max(1, (int) ($config['get_quantity'] ?? $config['get'] ?? 1));
        $discountType = strtolower((string) ($config['discount_type'] ?? 'free'));

        if (!in_array($discountType, ['free', 'percentage', 'fixed'], true)) {
            $discountType = 'free';
        }

        $discountValue = array_key_exists('discount_value', $config)
            ? (float) $config['discount_value']
            : ($discountType === 'percentage' ? 100.0 : 0.0);

        $eligibleUnitPrices = $this->eligibleUnitPrices($coupon, $items);
        $setSize = $buyQuantity + $getQuantity;
        $discountedUnits = intdiv(count($eligibleUnitPrices), $setSize) * $getQuantity;

        if ($discountedUnits < 1) {
            return [
                'eligible' => false,
                'message' => 'Cart does not contain the required eligible items for this promotion.',
                'strategy' => 'bogo',
                'applied_config' => null,
            ];
        }

        sort($eligibleUnitPrices, SORT_NUMERIC);

        $discountAmount = 0.0;

        foreach (array_slice($eligibleUnitPrices, 0, $discountedUnits) as $unitPrice) {
            if ($discountType === 'percentage') {
                $discountAmount += round($unitPrice * ($discountValue / 100), 2);
                continue;
            }

            if ($discountType === 'fixed') {
                $discountAmount += min($discountValue, $unitPrice);
                continue;
            }

            $discountAmount += $unitPrice;
        }

        return [
            'eligible' => true,
            'discount_amount' => min(round($discountAmount, 2), $subtotal),
            'strategy' => 'bogo',
            'applied_config' => [
                'buy_quantity' => $buyQuantity,
                'get_quantity' => $getQuantity,
                'discount_type' => $discountType,
                'discount_value' => number_format($discountValue, 2, '.', ''),
                'discounted_units' => $discountedUnits,
            ],
        ];
    }

    protected function calculateTieredPromotion(Coupon $coupon, object $regionRule, float $subtotal): array
    {
        $selectedTier = null;
        $selectedMinimum = 0.0;

        foreach ($this->normalizeTierConfig($coupon->tier_config ?? []) as $tier) {
            $minimumSubtotal = $this->tierMinimumSubtotal($tier);

            if ($subtotal >= $minimumSubtotal && ($selectedTier === null || $minimumSubtotal > $selectedMinimum)) {
                $selectedTier = $tier;
                $selectedMinimum = $minimumSubtotal;
            }
        }

        if ($selectedTier === null) {
            return [
                'eligible' => false,
                'message' => 'Cart subtotal does not meet any promotion tier.',
                'strategy' => 'tiered',
                'applied_config' => null,
            ];
        }

        $tierRule = (object) [
            'discount_type' => $selectedTier['discount_type'] ?? 'percentage',
            'discount_value' => (float) ($selectedTier['discount_value'] ?? 0),
            'maximum_discount' => array_key_exists('maximum_discount', $selectedTier)
                ? $selectedTier['maximum_discount']
                : $regionRule->maximum_discount,
        ];

        return [
            'eligible' => true,
            'discount_amount' => $this->calculateDiscountAmount($tierRule, $subtotal),
            'strategy' => 'tiered',
            'applied_config' => [
                'minimum_subtotal' => number_format($selectedMinimum, 2, '.', ''),
                'discount_type' => $tierRule->discount_type,
                'discount_value' => number_format((float) $tierRule->discount_value, 2, '.', ''),
                'maximum_discount' => $tierRule->maximum_discount !== null
                    ? number_format((float) $tierRule->maximum_discount, 2, '.', '')
                    : null,
            ],
        ];
    }

    protected function resolveDiscountStrategy(Coupon $coupon): string
    {
        $promotionType = $coupon->promotion_type ?: 'standard';

        if (in_array($promotionType, ['auto', 'payment_specific'], true)) {
            if (!empty($coupon->tier_config)) {
                return 'tiered';
            }

            if (!empty($coupon->bogo_config)) {
                return 'bogo';
            }

            return 'standard';
        }

        return in_array($promotionType, ['standard', 'bogo', 'tiered'], true)
            ? $promotionType
            : 'standard';
    }

    protected function normalizeTierConfig(array $config): array
    {
        if (isset($config['tiers']) && is_array($config['tiers'])) {
            $config = $config['tiers'];
        }

        return array_values(array_filter($config, fn ($tier) => is_array($tier)));
    }

    protected function tierMinimumSubtotal(array $tier): float
    {
        foreach (['minimum_subtotal', 'threshold', 'subtotal'] as $key) {
            if (array_key_exists($key, $tier)) {
                return (float) $tier[$key];
            }
        }

        return 0.0;
    }

    protected function eligibleUnitPrices(Coupon $coupon, array $items): array
    {
        $unitPrices = [];

        foreach ($items as $item) {
            if (!is_array($item) || !$this->itemPassesRestrictionChecks($coupon, $item)) {
                continue;
            }

            $quantity = max(0, (int) ($item['quantity'] ?? 0));

            if ($quantity < 1) {
                continue;
            }

            $unitPrice = $this->resolveItemUnitPrice($item, $quantity);

            if ($unitPrice <= 0) {
                continue;
            }

            for ($index = 0; $index < $quantity; $index++) {
                $unitPrices[] = $unitPrice;
            }
        }

        return $unitPrices;
    }

    protected function resolveItemUnitPrice(array $item, int $quantity): float
    {
        foreach (['unit_price', 'price'] as $key) {
            if (array_key_exists($key, $item)) {
                return max(0, (float) $item[$key]);
            }
        }

        foreach (['line_total', 'subtotal'] as $key) {
            if (array_key_exists($key, $item) && $quantity > 0) {
                return max(0, (float) $item[$key] / $quantity);
            }
        }

        return 0.0;
    }

    protected function passesPaymentMethodCheck(Coupon $coupon, $paymentMethod): bool
    {
        $allowedMethods = [];

        foreach ((array) ($coupon->payment_methods ?? []) as $allowedMethod) {
            $normalizedMethod = $this->normalizePaymentMethod($allowedMethod);

            if ($normalizedMethod !== null) {
                $allowedMethods[] = $normalizedMethod;
            }
        }

        if (empty($allowedMethods)) {
            return true;
        }

        $paymentMethod = $this->normalizePaymentMethod($paymentMethod);

        return $paymentMethod !== null && in_array($paymentMethod, $allowedMethods, true);
    }

    protected function normalizePaymentMethod($paymentMethod): ?string
    {
        if ($paymentMethod === null) {
            return null;
        }

        $paymentMethod = strtolower(trim((string) $paymentMethod));

        return $paymentMethod === '' ? null : $paymentMethod;
    }

    protected function isAutoPromotion(Coupon $coupon): bool
    {
        return (bool) $coupon->auto_apply || $coupon->promotion_type === 'auto';
    }

    protected function matchesCustomerType(string $customerType, User $user): bool
    {
        $customerType = $this->normalizeCustomerType($customerType);

        if ($customerType === null) {
            return true;
        }

        return $customerType === $this->resolveUserCustomerType($user);
    }

    protected function requiresAuthenticatedCustomer(Coupon $coupon): bool
    {
        return $coupon->usage_per_user !== null
            || $coupon->first_order_only
            || $this->normalizeCustomerType($coupon->customer_type) !== null
            || $coupon->users->isNotEmpty();
    }

    protected function resolveUserCustomerType(?User $user): ?string
    {
        if (!$user) {
            return null;
        }

        $role = strtolower(trim((string) $user->role));

        if (in_array($role, self::WHOLESALER_ROLES, true)) {
            return 'wholesaler';
        }

        if (in_array($role, ['customer', 'retail'], true)) {
            return 'customer';
        }

        return $role === '' ? null : $role;
    }

    protected function normalizeCustomerType($customerType): ?string
    {
        if ($customerType === null) {
            return null;
        }

        $customerType = strtolower(trim((string) $customerType));

        if ($customerType === '' || in_array($customerType, ['all', 'any'], true)) {
            return null;
        }

        if (in_array($customerType, self::WHOLESALER_ROLES, true)) {
            return 'wholesaler';
        }

        if (in_array($customerType, ['customer', 'retail'], true)) {
            return 'customer';
        }

        return $customerType;
    }

    protected function passesRestrictionChecks(Coupon $coupon, array $items): bool
    {
        if ($coupon->products->isEmpty() && $coupon->categories->isEmpty() && $coupon->brands->isEmpty()) {
            return true;
        }

        foreach ($items as $item) {
            if (is_array($item) && $this->itemPassesRestrictionChecks($coupon, $item)) {
                return true;
            }
        }

        return false;
    }

    protected function itemPassesRestrictionChecks(Coupon $coupon, array $item): bool
    {
        if ($coupon->products->isEmpty() && $coupon->categories->isEmpty() && $coupon->brands->isEmpty()) {
            return true;
        }

        $productId = $item['product_id'] ?? null;
        $categoryIds = array_values(array_filter((array) ($item['category_ids'] ?? [])));
        $brandId = $item['brand_id'] ?? null;

        if ($productId && $coupon->products->contains('id', $productId)) {
            return true;
        }

        if ($brandId && $coupon->brands->contains('id', $brandId)) {
            return true;
        }

        return !empty($categoryIds) && $coupon->categories->whereIn('id', $categoryIds)->isNotEmpty();
    }
}
