<?php

namespace App\Services\Order;

use App\Interfaces\Order\OrderRepositoryInterface;
use App\Interfaces\Order\OrderServiceInterface;
use App\Interfaces\Cart\CartServiceInterface;
use App\Services\Coupon\CouponValidationService;
use App\Models\Order;
use App\Models\CouponRedemption;
use App\Models\User;
use App\Models\Discount;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService implements OrderServiceInterface
{
    protected $orderRepository;
    protected $cartService;
    protected $couponValidationService;

    public function __construct(
        OrderRepositoryInterface $orderRepository,
        CartServiceInterface $cartService,
        CouponValidationService $couponValidationService
    )
    {
        $this->orderRepository = $orderRepository;
        $this->cartService = $cartService;
        $this->couponValidationService = $couponValidationService;
    }

    /**
     * Fetch all orders for the authenticated customer.
     */
    public function getUserOrders(string $userId)
    {
        return Order::with(['items.variant.product', 'items.variant.color', 'items.variant.size'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get details of a specific order.
     */
    public function getOrderById(string $userId, string $orderId, bool $isAdmin = false): Order
    {
        $order = $this->orderRepository->findById($orderId);

        if (!$order) {
            abort(404, 'Order not found.');
        }

        if (!$isAdmin && $order->user_id !== $userId) {
            abort(403, 'Unauthorized access to order.');
        }

        return $order;
    }

    /**
     * Checkout user's cart and create an order in a secure database transaction.
     */
    public function createOrderFromCart(string $userId, array $shippingAddress, ?string $notes, ?string $addressId = null, string $currency = 'NPR', ?string $couponCode = null): Order
    {
        $cart = $this->cartService->getCartForUser($userId);

        if ($cart->items->isEmpty()) {
            throw new \Exception("Cannot place order. Your cart is empty.");
        }

        $user = User::findOrFail($userId);
        $userType = $this->orderUserType($user);
        $currency = $this->normalizeCurrency($currency);

        return DB::transaction(function () use ($userId, $user, $cart, $userType, $currency, $shippingAddress, $notes, $addressId, $couponCode) {
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $subtotal = 0;
            $discountAmount = 0;
            $total = 0;
            $orderItemsData = [];
            $couponId = null;
            $couponDiscount = 0.00;
            $couponSubtotal = 0.00;
            $couponItems = [];

            foreach ($cart->items as $item) {
                $variant = $item->variant;

                if (!$variant) {
                    throw new \Exception("One of the items in your cart is no longer available.");
                }

                if (!$variant->is_active) {
                    throw new \Exception("Product variant '{$variant->variant_name}' is inactive and cannot be ordered.");
                }

                if ($variant->stock < $item->quantity) {
                    throw new \Exception("Insufficient stock for '{$variant->variant_name}'. Only {$variant->stock} left.");
                }

                $unitPrice = $this->unitPriceFor($variant, $userType, $currency);
                $discount = $this->activeDiscountFor($variant);
                $unitDiscount = $discount
                    ? $discount->calculateAmountFor($unitPrice, $userType, $currency)
                    : 0.00;

                $lineSubtotal = $unitPrice * $item->quantity;
                $lineDiscount = $unitDiscount * $item->quantity;
                $lineTotal = ($unitPrice - $unitDiscount) * $item->quantity;

                $subtotal += $lineSubtotal;
                $discountAmount += $lineDiscount;
                $total += $lineTotal;

                // Decrement stock
                $variant->decrement('stock', $item->quantity);

                $orderItemsData[] = [
                    'variant_id' => $variant->id,
                    'quantity' => $item->quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $unitDiscount,
                    'line_total' => $lineTotal,
                ];

                $couponItems[] = [
                    'product_id' => $variant->product_id,
                    'brand_id' => $variant->product?->brand_id,
                    'category_ids' => $variant->product ? $variant->product->categories->pluck('id')->all() : [],
                ];
            }

            if ($couponCode) {
                $couponSubtotal = $total;
                $validation = $this->couponValidationService->validateCoupon([
                    'code' => $couponCode,
                    'subtotal' => $couponSubtotal,
                    'shipping_address' => $shippingAddress,
                    'items' => $couponItems,
                ], $user);

                if (!($validation['success'] ?? false)) {
                    throw new \Exception($validation['message'] ?? 'Coupon validation failed.');
                }

                $couponId = $validation['data']['coupon_id'];
                $couponDiscount = (float) $validation['data']['discount_amount'];
                $couponCurrency = $validation['data']['applied_rule']['currency'] ?? 'USD';
                $discountAmount += $couponDiscount;
                $total = max(0, $total - $couponDiscount);
            }

            // Create Order
            $order = $this->orderRepository->create([
                'user_id' => $userId,
                'order_number' => $orderNumber,
                'user_type' => $userType,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'shipping_address' => $shippingAddress,
                'address_id' => $addressId,
                'currency' => $currency,
                'notes' => $notes,
            ]);

            // Save order items
            foreach ($orderItemsData as $itemData) {
                $order->items()->create($itemData);
            }

            if ($couponId) {
                CouponRedemption::create([
                    'coupon_id' => $couponId,
                    'user_id' => $userId,
                    'order_id' => $order->id,
                    'currency' => $couponCurrency ?? 'USD',
                    'subtotal' => $couponSubtotal,
                    'discount_amount' => $couponDiscount,
                    'redeemed_at' => now(),
                ]);
            }

            // Clear the cart
            $this->cartService->clearUserCart($userId);

            return $order->load(['items.variant.product']);
        });
    }

    /**
     * Admin: create an order directly for a user with explicit items (no cart).
     */
    public function createOrderDirect(
        string $adminUserId,
        string $userId,
        array $items,
        array $shippingAddress,
        ?string $notes,
        ?string $addressId = null,
        string $currency = 'NPR'
    ): Order {
        $user = User::findOrFail($userId);
        $userType = $this->orderUserType($user);
        $currency = $this->normalizeCurrency($currency);

        return DB::transaction(function () use ($userId, $userType, $currency, $items, $shippingAddress, $notes, $addressId) {
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $subtotal       = 0;
            $discountAmount = 0;
            $total          = 0;
            $orderItemsData = [];

            foreach ($items as $item) {
                $variant = ProductVariant::findOrFail($item['variant_id']);

                if (!$variant->is_active) {
                    throw new \Exception("Variant '{$variant->variant_name}' is inactive.");
                }
                if ($variant->stock < $item['quantity']) {
                    throw new \Exception("Insufficient stock for '{$variant->variant_name}'. Only {$variant->stock} left.");
                }

                $unitPrice = $this->unitPriceFor($variant, $userType, $currency);
                $discount = $this->activeDiscountFor($variant);
                $unitDiscount = $discount
                    ? $discount->calculateAmountFor($unitPrice, $userType, $currency)
                    : 0.00;

                $lineTotal = ($unitPrice - $unitDiscount) * $item['quantity'];

                $subtotal       += $unitPrice * $item['quantity'];
                $discountAmount += $unitDiscount * $item['quantity'];
                $total          += $lineTotal;

                $variant->decrement('stock', $item['quantity']);

                $orderItemsData[] = [
                    'variant_id'      => $variant->id,
                    'quantity'        => $item['quantity'],
                    'unit_price'      => $unitPrice,
                    'discount_amount' => $unitDiscount,
                    'line_total'      => $lineTotal,
                ];
            }

            $order = $this->orderRepository->create([
                'user_id'          => $userId,
                'order_number'     => $orderNumber,
                'user_type'        => $userType,
                'subtotal'         => $subtotal,
                'discount_amount'  => $discountAmount,
                'total'            => $total,
                'status'           => 'pending',
                'payment_status'   => 'unpaid',
                'shipping_address' => $shippingAddress,
                'address_id'       => $addressId,
                'currency'         => $currency,
                'notes'            => $notes,
            ]);

            foreach ($orderItemsData as $itemData) {
                $order->items()->create($itemData);
            }

            return $order->load(['user', 'items.variant.product']);
        });
    }

    /**
     * Admin method to list all orders with filters.
     */
    public function getAllOrders(array $filters)
    {
        return $this->orderRepository->all($filters);
    }

    /**
     * Update order status or payment status.
     */
    public function updateOrderStatus(string $orderId, ?string $status, ?string $paymentStatus): Order
    {
        return DB::transaction(function () use ($orderId, $status, $paymentStatus) {
            $data = [];
            if ($status !== null) {
                $data['status'] = $status;
            }
            if ($paymentStatus !== null) {
                $data['payment_status'] = $paymentStatus;
            }

            $order = $this->orderRepository->update($orderId, $data);

            // If payment_status was updated to 'paid', sync the associated Payment records
            if ($paymentStatus === 'paid') {
                $order->payments()->where('status', 'pending')->update([
                    'status' => 'completed',
                    'paid_at' => now(),
                    'transaction_id' => $order->payments()->where('status', 'completed')->exists() 
                        ? null 
                        : 'MANUAL-' . strtoupper(Str::random(10))
                ]);
            } elseif ($paymentStatus === 'unpaid') {
                $order->payments()->where('status', 'completed')->update([
                    'status' => 'pending',
                ]);
            }

            return $order;
        });
    }

    private function orderUserType(User $user): string
    {
        return $this->isApprovedWholesaler($user) ? 'wholesale' : 'retail';
    }

    private function isApprovedWholesaler(User $user): bool
    {
        return ($user->role === 'wholesaler' || $user->role === 'wholeseller')
            && $user->wholeseller_status === 'approved';
    }

    private function normalizeCurrency(string $currency): string
    {
        return strtoupper($currency) === 'USD' ? 'USD' : 'NPR';
    }

    private function unitPriceFor(ProductVariant $variant, string $userType, string $currency): float
    {
        if ($currency === 'USD') {
            if ($userType === 'wholesale') {
                $price = $variant->international_wholesale_price ?? $variant->international_price;
            } else {
                $price = $variant->international_price;
            }

            if ($price === null || $price === '') {
                throw new \Exception("International price is unavailable for '{$variant->variant_name}'.");
            }

            return (float) $price;
        }

        return (float) ($userType === 'wholesale'
            ? $variant->wholesale_price
            : $variant->retail_price);
    }

    private function activeDiscountFor(ProductVariant $variant): ?Discount
    {
        $now = now();

        return Discount::where('is_active', true)
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now)
            ->where(function ($q) use ($variant) {
                $q->where('variant_id', $variant->id)
                    ->orWhere(function ($q2) use ($variant) {
                        $q2->where('product_id', $variant->product_id)
                            ->whereNull('variant_id');
                    });
            })
            ->orderBy('variant_id', 'desc')
            ->first();
    }
}
