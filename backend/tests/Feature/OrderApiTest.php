<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Discount;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    protected $customer;
    protected $wholesaler;
    protected $admin;
    protected $product;
    protected $variant1;
    protected $variant2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Retail Customer',
            'email' => 'retail@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $this->wholesaler = User::create([
            'name' => 'Wholesaler Partner',
            'email' => 'wholesaler@example.com',
            'password' => bcrypt('password123'),
            'role' => 'wholesaler',
            'wholeseller_status' => 'approved',
        ]);

        $this->admin = User::create([
            'name' => 'Admin Owner',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->product = Product::create([
            'name' => 'Smart Gadget',
            'slug' => 'smart-gadget',
        ]);

        $this->variant1 = $this->product->variants()->create([
            'variant_name' => 'Model A',
            'sku' => 'GAD-A',
            'retail_price' => 100.00,
            'wholesale_price' => 80.00,
            'international_price' => 120.00,
            'stock' => 50,
            'is_active' => true,
        ]);

        $this->variant2 = $this->product->variants()->create([
            'variant_name' => 'Model B',
            'sku' => 'GAD-B',
            'retail_price' => 200.00,
            'wholesale_price' => 150.00,
            'international_price' => 240.00,
            'stock' => 10,
            'is_active' => true,
        ]);
    }

    /** @test */
    public function guest_users_cannot_access_order_endpoints()
    {
        $this->getJson('/api/orders')->assertStatus(401);
        $this->postJson('/api/orders', [])->assertStatus(401);
        $this->getJson('/api/orders/some-uuid')->assertStatus(401);

        $this->getJson('/api/admin/orders')->assertStatus(401);
        $this->getJson('/api/admin/orders/some-uuid')->assertStatus(401);
        $this->putJson('/api/admin/orders/some-uuid', [])->assertStatus(401);
    }

    /** @test */
    public function customer_role_cannot_access_admin_endpoints()
    {
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/admin/orders')->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/admin/orders/some-uuid')->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->putJson('/api/admin/orders/some-uuid', [])->assertStatus(403);
    }

    /** @test */
    public function checkout_fails_if_cart_is_empty()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Tech Lane',
                'city' => 'Silicon Valley',
                'state' => 'CA',
                'zip' => '94025',
                'country' => 'USA',
            ]
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot place order. Your cart is empty.');
    }

    /** @test */
    public function retail_customer_checkout_calculates_retail_price_and_active_discounts()
    {
        // 1. Create an active 10% discount on variant1
        Discount::create([
            'variant_id' => $this->variant1->id,
            'type' => 'percent',
            'value' => 10.00,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'is_active' => true,
        ]);

        // 2. Set up cart for the customer
        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create(['variant_id' => $this->variant1->id, 'quantity' => 2]); // retail = 100, discounted = 90
        $cart->items()->create(['variant_id' => $this->variant2->id, 'quantity' => 1]); // retail = 200, no discount

        // 3. Checkout
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Tech Lane',
                'city' => 'Silicon Valley',
                'state' => 'CA',
                'zip' => '94025',
                'country' => 'USA',
            ],
            'notes' => 'Deliver before 5 PM'
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user_type', 'retail')
            ->assertJsonPath('data.subtotal', '400.00') // (100*2) + (200*1)
            ->assertJsonPath('data.discount_amount', '20.00') // (10*2) + 0
            ->assertJsonPath('data.total', '380.00'); // 400 - 20

        // 4. Verify DB changes
        $this->assertDatabaseHas('orders', [
            'user_id' => $this->customer->id,
            'user_type' => 'retail',
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $order = Order::first();
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
            'unit_price' => 100.00,
            'discount_amount' => 10.00,
            'line_total' => 180.00,
        ]);

        // 5. Verify stock decremented
        $this->variant1->refresh();
        $this->assertEquals(48, $this->variant1->stock);

        // 6. Verify cart cleared
        $this->assertDatabaseMissing('cart_items', ['cart_id' => $cart->id]);
    }

    /** @test */
    public function wholesaler_checkout_calculates_wholesale_price_and_active_discounts()
    {
        // 1. Create active fixed wholesale discount on product
        Discount::create([
            'product_id' => $this->product->id,
            'type' => 'fixed',
            'value' => 30.00,
            'wholesale_type' => 'fixed',
            'wholesale_value' => 5.00,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'is_active' => true,
        ]);

        // 2. Set up cart for wholesaler
        $cart = Cart::create(['user_id' => $this->wholesaler->id]);
        $cart->items()->create(['variant_id' => $this->variant1->id, 'quantity' => 5]); // wholesale = 80, discounted = 75

        // 3. Checkout
        $response = $this->actingAs($this->wholesaler, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => 'Wholesale Depot',
                'city' => 'Houston',
                'state' => 'TX',
                'zip' => '77001',
                'country' => 'USA',
            ]
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user_type', 'wholesale')
            ->assertJsonPath('data.subtotal', '400.00') // 80 * 5
            ->assertJsonPath('data.discount_amount', '25.00') // 5 * 5
            ->assertJsonPath('data.total', '375.00');

        $this->variant1->refresh();
        $this->assertEquals(45, $this->variant1->stock);
    }

    /** @test */
    public function pending_wholesaler_checkout_uses_retail_price_without_wholesale_discount()
    {
        $pendingWholesaler = User::create([
            'name' => 'Pending Wholesaler',
            'email' => 'pending-wholesaler@example.com',
            'password' => bcrypt('password123'),
            'role' => 'wholesaler',
            'wholeseller_status' => 'pending',
        ]);

        Discount::create([
            'product_id' => $this->product->id,
            'wholesale_type' => 'fixed',
            'wholesale_value' => 50.00,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'is_active' => true,
        ]);

        $cart = Cart::create(['user_id' => $pendingWholesaler->id]);
        $cart->items()->create(['variant_id' => $this->variant1->id, 'quantity' => 1]);

        $response = $this->actingAs($pendingWholesaler, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => 'Pending Depot',
                'city' => 'Dallas',
                'state' => 'TX',
                'zip' => '75001',
                'country' => 'USA',
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user_type', 'retail')
            ->assertJsonPath('data.subtotal', '100.00')
            ->assertJsonPath('data.discount_amount', '0.00')
            ->assertJsonPath('data.total', '100.00');
    }

    /** @test */
    public function international_customer_checkout_uses_international_price_and_discount()
    {
        Discount::create([
            'variant_id' => $this->variant1->id,
            'type' => 'fixed',
            'value' => 80.00,
            'international_type' => 'fixed',
            'international_value' => 2.00,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'is_active' => true,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create(['variant_id' => $this->variant1->id, 'quantity' => 2]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'currency' => 'USD',
            'shipping_address' => [
                'street' => '123 Global Lane',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user_type', 'retail')
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.subtotal', '240.00')
            ->assertJsonPath('data.discount_amount', '4.00')
            ->assertJsonPath('data.total', '236.00');

        $order = Order::first();
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'variant_id' => $this->variant1->id,
            'quantity' => 2,
            'unit_price' => 120.00,
            'discount_amount' => 2.00,
            'line_total' => 236.00,
        ]);
    }

    /** @test */
    public function international_approved_wholesaler_checkout_uses_wholesale_international_discount()
    {
        Discount::create([
            'product_id' => $this->product->id,
            'wholesale_type' => 'fixed',
            'wholesale_value' => 25.00,
            'wholesale_international_type' => 'percent',
            'wholesale_international_value' => 10.00,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'is_active' => true,
        ]);

        $cart = Cart::create(['user_id' => $this->wholesaler->id]);
        $cart->items()->create(['variant_id' => $this->variant1->id, 'quantity' => 1]);

        $response = $this->actingAs($this->wholesaler, 'sanctum')->postJson('/api/orders', [
            'currency' => 'USD',
            'shipping_address' => [
                'street' => 'Wholesale Global',
                'city' => 'Chicago',
                'state' => 'IL',
                'zip' => '60601',
                'country' => 'USA',
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user_type', 'wholesale')
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.subtotal', '120.00')
            ->assertJsonPath('data.discount_amount', '12.00')
            ->assertJsonPath('data.total', '108.00');
    }

    /** @test */
    public function checkout_fails_if_insufficient_stock()
    {
        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create(['variant_id' => $this->variant2->id, 'quantity' => 11]); // stock is only 10

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Tech Lane',
                'city' => 'Silicon Valley',
                'state' => 'CA',
                'zip' => '94025',
                'country' => 'USA',
            ]
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', "Insufficient stock for 'Model B'. Only 10 left.");
    }

    /** @test */
    public function customer_can_retrieve_only_their_own_orders()
    {
        // Customer 1 Order
        $order1 = Order::create([
            'user_id' => $this->customer->id,
            'order_number' => 'ORD-111111',
            'user_type' => 'retail',
            'subtotal' => 100,
            'total' => 100,
            'shipping_address' => ['street' => 'Street A'],
        ]);

        // Wholesaler Order
        $order2 = Order::create([
            'user_id' => $this->wholesaler->id,
            'order_number' => 'ORD-222222',
            'user_type' => 'wholesale',
            'subtotal' => 200,
            'total' => 200,
            'shipping_address' => ['street' => 'Street B'],
        ]);

        // Get retail customer order list
        $response = $this->actingAs($this->customer, 'sanctum')->getJson('/api/orders');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $order1->id);

        // Get retail customer specific order
        $this->actingAs($this->customer, 'sanctum')->getJson("/api/orders/{$order1->id}")->assertStatus(200);

        // Attempting to access wholesaler's order fails with 403
        $this->actingAs($this->customer, 'sanctum')->getJson("/api/orders/{$order2->id}")->assertStatus(403);
    }

    /** @test */
    public function admin_can_view_all_orders_and_filter_them()
    {
        $order1 = Order::create([
            'user_id' => $this->customer->id,
            'order_number' => 'ORD-111111',
            'user_type' => 'retail',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => 100,
            'total' => 100,
            'shipping_address' => ['street' => 'Street A'],
        ]);

        $order2 = Order::create([
            'user_id' => $this->wholesaler->id,
            'order_number' => 'ORD-222222',
            'user_type' => 'wholesale',
            'status' => 'processing',
            'payment_status' => 'paid',
            'subtotal' => 200,
            'total' => 200,
            'shipping_address' => ['street' => 'Street B'],
        ]);

        // Admin gets all orders
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/orders');
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data.data');

        // Admin filters by status
        $responseFiltered = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/orders?status=processing');
        $responseFiltered->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $order2->id);
    }

    /** @test */
    public function admin_can_update_order_status_and_payment_status()
    {
        $order = Order::create([
            'user_id' => $this->customer->id,
            'order_number' => 'ORD-111111',
            'user_type' => 'retail',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => 100,
            'total' => 100,
            'shipping_address' => ['street' => 'Street A'],
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/orders/{$order->id}", [
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);
    }

    /** @test */
    public function international_approved_wholesaler_checkout_uses_international_wholesale_price()
    {
        $this->variant1->update([
            'international_wholesale_price' => 95.00,
        ]);

        $cart = Cart::create(['user_id' => $this->wholesaler->id]);
        $cart->items()->create(['variant_id' => $this->variant1->id, 'quantity' => 1]);

        $response = $this->actingAs($this->wholesaler, 'sanctum')->postJson('/api/orders', [
            'currency' => 'USD',
            'shipping_address' => [
                'street' => 'Wholesale Global',
                'city' => 'Chicago',
                'state' => 'IL',
                'zip' => '60601',
                'country' => 'USA',
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user_type', 'wholesale')
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.subtotal', '95.00')
            ->assertJsonPath('data.total', '95.00');

        $order = Order::first();
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'variant_id' => $this->variant1->id,
            'unit_price' => 95.00,
            'line_total' => 95.00,
        ]);
    }
}
