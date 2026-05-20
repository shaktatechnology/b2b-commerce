<?php

namespace App\Interfaces\Cart;

use App\Models\Cart;
use App\Models\CartItem;

interface CartRepositoryInterface
{
    public function getOrCreateCartForUser(string $userId): Cart;
    public function addItem(Cart $cart, string $variantId, int $quantity): CartItem;
    public function updateItemQuantity(string $cartItemId, int $quantity): CartItem;
    public function removeItem(string $cartItemId): bool;
    public function clearCart(Cart $cart): bool;
    public function syncItems(Cart $cart, array $items): void;
}
