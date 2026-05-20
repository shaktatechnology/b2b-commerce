<?php

namespace App\Http\Controllers\Api\Cart;

use App\Http\Controllers\Controller;
use App\Interfaces\Cart\CartServiceInterface;
use App\Http\Requests\Api\Cart\AddToCartRequest;
use App\Http\Requests\Api\Cart\UpdateCartItemRequest;
use App\Http\Requests\Api\Cart\SyncCartRequest;
use Illuminate\Http\Request;

class CartController extends Controller
{
    protected $cartService;

    public function __construct(CartServiceInterface $cartService)
    {
        $this->cartService = $cartService;
    }

    /**
     * Retrieve the authenticated user's cart.
     */
    public function index(Request $request)
    {
        $cart = $this->cartService->getCartForUser($request->user()->id);

        return response()->json([
            'data' => $cart
        ]);
    }

    /**
     * Add an item to the cart.
     */
    public function store(AddToCartRequest $request)
    {
        $cartItem = $this->cartService->addItemToCart(
            $request->user()->id,
            $request->input('variant_id'),
            $request->input('quantity')
        );

        return response()->json([
            'message' => 'Item added to cart successfully',
            'data' => $cartItem
        ], 201);
    }

    /**
     * Update the quantity of a cart item.
     */
    public function update(UpdateCartItemRequest $request, string $id)
    {
        $cartItem = $this->cartService->updateCartItemQuantity(
            $request->user()->id,
            $id,
            $request->input('quantity')
        );

        return response()->json([
            'message' => 'Cart item quantity updated successfully',
            'data' => $cartItem
        ]);
    }

    /**
     * Remove an item from the cart.
     */
    public function destroy(Request $request, string $id)
    {
        $this->cartService->removeCartItem($request->user()->id, $id);

        return response()->json([
            'message' => 'Item removed from cart successfully'
        ]);
    }

    /**
     * Clear all items in the user's cart.
     */
    public function clear(Request $request)
    {
        $this->cartService->clearUserCart($request->user()->id);

        return response()->json([
            'message' => 'Cart cleared successfully'
        ]);
    }

    /**
     * Sync local guest items into the user's database cart.
     */
    public function sync(SyncCartRequest $request)
    {
        $cart = $this->cartService->syncGuestCart(
            $request->user()->id,
            $request->input('items')
        );

        return response()->json([
            'message' => 'Cart synced successfully',
            'data' => $cart
        ]);
    }
}
