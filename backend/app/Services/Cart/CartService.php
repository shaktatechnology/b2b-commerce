<?php

namespace App\Services\Cart;

use App\Interfaces\Cart\CartRepositoryInterface;
use App\Interfaces\Cart\CartServiceInterface;
use App\Models\Cart;
use App\Models\CartItem;

class CartService implements CartServiceInterface
{
    protected $cartRepository;

    public function __construct(CartRepositoryInterface $cartRepository)
    {
        $this->cartRepository = $cartRepository;
    }

    /**
     * Get user's cart, creating one if it doesn't exist.
     */
    public function getCartForUser(string $userId): Cart
    {
        return $this->cartRepository->getOrCreateCartForUser($userId);
    }

    /**
     * Add a variant item to user's cart.
     */
    public function addItemToCart(string $userId, string $variantId, int $quantity): CartItem
    {
        $cart = $this->cartRepository->getOrCreateCartForUser($userId);
        return $this->cartRepository->addItem($cart, $variantId, $quantity);
    }

    /**
     * Update quantity of a cart item, ensuring it belongs to the user's cart.
     */
    public function updateCartItemQuantity(string $userId, string $cartItemId, int $quantity): CartItem
    {
        $cart = $this->cartRepository->getOrCreateCartForUser($userId);
        $cartItem = $cart->items()->where('id', $cartItemId)->firstOrFail();
        
        return $this->cartRepository->updateItemQuantity($cartItem->id, $quantity);
    }

    /**
     * Remove an item from the user's cart, ensuring it belongs to the user's cart.
     */
    public function removeCartItem(string $userId, string $cartItemId): bool
    {
        $cart = $this->cartRepository->getOrCreateCartForUser($userId);
        $cartItem = $cart->items()->where('id', $cartItemId)->firstOrFail();
        
        return $this->cartRepository->removeItem($cartItem->id);
    }

    /**
     * Clear all items in the user's cart.
     */
    public function clearUserCart(string $userId): bool
    {
        $cart = $this->cartRepository->getOrCreateCartForUser($userId);
        return $this->cartRepository->clearCart($cart);
    }

    /**
     * Sync local guest items into the user's database cart upon login.
     */
    public function syncGuestCart(string $userId, array $items): Cart
    {
        $cart = $this->cartRepository->getOrCreateCartForUser($userId);
        
        $this->cartRepository->syncItems($cart, $items);
        
        return $cart->fresh(['items.variant.product']);
    }
}
