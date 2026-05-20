<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartApiTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $anotherUser;
    protected $product;
    protected $variant1;
    protected $variant2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $this->anotherUser = User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $this->product = Product::create([
            'name' => 'Test Product',
            'slug' => 'test-product',
        ]);

        $this->variant1 = $this->product->variants()->create([
            'variant_name' => 'Small',
            'sku' => 'VAR-S',
            'retail_price' => 10.00,
            'wholesale_price' => 8.00,
            'stock' => 100,
        ]);

        $this->variant2 = $this->product->variants()->create([
            'variant_name' => 'Large',
            'sku' => 'VAR-L',
            'retail_price' => 20.00,
            'wholesale_price' => 16.00,
            'stock' => 50,
        ]);
    }

    /** @test */
    public function unauthenticated_users_are_blocked_from_cart_endpoints()
    {
        $this->getJson('/api/cart')->assertStatus(401);
        $this->postJson('/api/cart', [])->assertStatus(401);
        $this->putJson('/api/cart/items/some-uuid', [])->assertStatus(401);
        $this->deleteJson('/api/cart/items/some-uuid')->assertStatus(401);
        $this->deleteJson('/api/cart')->assertStatus(401);
        $this->postJson('/api/cart/sync', [])->assertStatus(401);
    }

    /** @test */
    public function an_authenticated_user_can_retrieve_their_empty_cart()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/cart');

        $response->assertStatus(200)
            ->assertJsonPath('data.user_id', $this->user->id)
            ->assertJsonCount(0, 'data.items');
    }

    /** @test */
    public function an_authenticated_user_can_add_item_to_cart()
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/cart', [
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.variant_id', $this->variant1->id)
            ->assertJsonPath('data.quantity', 2);

        $this->assertDatabaseHas('cart_items', [
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);
    }

    /** @test */
    public function adding_duplicate_item_aggregates_the_quantity()
    {
        // Add once
        $this->actingAs($this->user, 'sanctum')->postJson('/api/cart', [
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);

        // Add again
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/cart', [
            'variant_id' => $this->variant1->id,
            'quantity' => 3,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.quantity', 5);

        $this->assertDatabaseHas('cart_items', [
            'variant_id' => $this->variant1->id,
            'quantity' => 5,
        ]);
    }

    /** @test */
    public function an_authenticated_user_can_update_cart_item_quantity()
    {
        $cart = Cart::create(['user_id' => $this->user->id]);
        $item = $cart->items()->create([
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->putJson("/api/cart/items/{$item->id}", [
            'quantity' => 10,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.quantity', 10);

        $this->assertDatabaseHas('cart_items', [
            'id' => $item->id,
            'quantity' => 10,
        ]);
    }

    /** @test */
    public function updating_cart_item_of_another_user_fails()
    {
        $cart = Cart::create(['user_id' => $this->anotherUser->id]);
        $item = $cart->items()->create([
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->putJson("/api/cart/items/{$item->id}", [
            'quantity' => 10,
        ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function an_authenticated_user_can_remove_item_from_cart()
    {
        $cart = Cart::create(['user_id' => $this->user->id]);
        $item = $cart->items()->create([
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->deleteJson("/api/cart/items/{$item->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Item removed from cart successfully');

        $this->assertDatabaseMissing('cart_items', [
            'id' => $item->id,
        ]);
    }

    /** @test */
    public function removing_cart_item_of_another_user_fails()
    {
        $cart = Cart::create(['user_id' => $this->anotherUser->id]);
        $item = $cart->items()->create([
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->deleteJson("/api/cart/items/{$item->id}");

        $response->assertStatus(404);
    }

    /** @test */
    public function an_authenticated_user_can_clear_cart()
    {
        $cart = Cart::create(['user_id' => $this->user->id]);
        $cart->items()->create([
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);
        $cart->items()->create([
            'variant_id' => $this->variant2->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->deleteJson("/api/cart");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Cart cleared successfully');

        $this->assertDatabaseMissing('cart_items', [
            'cart_id' => $cart->id,
        ]);
    }

    /** @test */
    public function an_authenticated_user_can_sync_guest_cart()
    {
        // User already has variant1 in cart with qty 2
        $cart = Cart::create(['user_id' => $this->user->id]);
        $cart->items()->create([
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
        ]);

        // Sync local guest items: variant1 with qty 3 (aggregates to 5), and variant2 with qty 4 (new item)
        $response = $this->actingAs($this->user, 'sanctum')->postJson("/api/cart/sync", [
            'items' => [
                [
                    'variant_id' => $this->variant1->id,
                    'quantity' => 3,
                ],
                [
                    'variant_id' => $this->variant2->id,
                    'quantity' => 4,
                ]
            ]
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Cart synced successfully')
            ->assertJsonCount(2, 'data.items');

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $cart->id,
            'variant_id' => $this->variant1->id,
            'quantity' => 5,
        ]);

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $cart->id,
            'variant_id' => $this->variant2->id,
            'quantity' => 4,
        ]);
    }
}
