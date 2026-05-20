<?php

namespace App\Interfaces\Cart;

use App\Models\Cart;
use App\Models\CartItem;

interface CartServiceInterface
{
    public function getCartForUser(string $userId): Cart;
    public function addItemToCart(string $userId, string $variantId, int $quantity): CartItem;
    public function updateCartItemQuantity(string $userId, string $cartItemId, int $quantity): CartItem;
    public function removeCartItem(string $userId, string $cartItemId): bool;
    public function clearUserCart(string $userId): bool;
    public function syncGuestCart(string $userId, array $items): Cart;
}
