<?php

namespace App\Interfaces\Order;

use App\Models\Order;

interface OrderServiceInterface
{
    public function getUserOrders(string $userId);
    public function getOrderById(string $userId, string $orderId, bool $isAdmin = false): Order;
    public function createOrderFromCart(string $userId, array $shippingAddress, ?string $notes, ?string $addressId = null, string $currency = 'NPR'): Order;
    public function createOrderDirect(string $adminUserId, string $userId, array $items, array $shippingAddress, ?string $notes, ?string $addressId = null, string $currency = 'NPR'): Order;
    public function getAllOrders(array $filters);
    public function updateOrderStatus(string $orderId, ?string $status, ?string $paymentStatus): Order;
}
