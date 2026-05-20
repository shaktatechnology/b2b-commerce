<?php

namespace App\Repositories\Cart;

use App\Interfaces\Cart\CartRepositoryInterface;
use App\Models\Cart;
use App\Models\CartItem;

class CartRepository implements CartRepositoryInterface
{
    /**
     * Get or create a cart for the user.
     */
    public function getOrCreateCartForUser(string $userId): Cart
    {
        $cart = Cart::firstOrCreate(['user_id' => $userId]);
        
        // Eager load items and variant with product and any needed details
        return $cart->load(['items.variant.product']);
    }

    /**
     * Add an item to the cart, or aggregate quantity if it already exists.
     */
    public function addItem(Cart $cart, string $variantId, int $quantity): CartItem
    {
        $cartItem = $cart->items()->where('variant_id', $variantId)->first();

        if ($cartItem) {
            $cartItem->quantity += $quantity;
            $cartItem->save();
        } else {
            $cartItem = $cart->items()->create([
                'variant_id' => $variantId,
                'quantity' => $quantity,
            ]);
        }

        return $cartItem->load(['variant.product']);
    }

    /**
     * Update the quantity of a specific cart item.
     */
    public function updateItemQuantity(string $cartItemId, int $quantity): CartItem
    {
        $cartItem = CartItem::findOrFail($cartItemId);
        $cartItem->update(['quantity' => $quantity]);
        
        return $cartItem->load(['variant.product']);
    }

    /**
     * Remove an item from the cart.
     */
    public function removeItem(string $cartItemId): bool
    {
        $cartItem = CartItem::findOrFail($cartItemId);
        return $cartItem->delete();
    }

    /**
     * Clear all items from the cart.
     */
    public function clearCart(Cart $cart): bool
    {
        $cart->items()->delete();
        return true;
    }

    /**
     * Sync guest items into the authenticated user's cart.
     */
    public function syncItems(Cart $cart, array $items): void
    {
        foreach ($items as $item) {
            $variantId = $item['variant_id'];
            $quantity = $item['quantity'];

            $cartItem = $cart->items()->where('variant_id', $variantId)->first();

            if ($cartItem) {
                $cartItem->quantity += $quantity;
                $cartItem->save();
            } else {
                $cart->items()->create([
                    'variant_id' => $variantId,
                    'quantity' => $quantity,
                ]);
            }
        }
    }
}
