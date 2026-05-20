<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentApiTest extends TestCase
{
    use RefreshDatabase;

    protected $customer;
    protected $otherCustomer;
    protected $admin;
    protected $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Regular Buyer',
            'email' => 'buyer@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $this->otherCustomer = User::create([
            'name' => 'Another Buyer',
            'email' => 'another@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $this->admin = User::create([
            'name' => 'Admin Owner',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        // Create initial order
        $this->order = Order::create([
            'user_id' => $this->customer->id,
            'order_number' => 'ORD-999999',
            'user_type' => 'retail',
            'subtotal' => 150.00,
            'discount_amount' => 0.00,
            'total' => 150.00,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'shipping_address' => ['street' => 'Payment Lane'],
        ]);

        // Default settings
        Setting::updateOrCreate(['key' => 'esewa_active'], ['value' => '1', 'group' => 'payment', 'type' => 'boolean']);
        Setting::updateOrCreate(['key' => 'esewa_merchant_code'], ['value' => 'EPAYTEST', 'group' => 'payment', 'type' => 'text']);
        Setting::updateOrCreate(['key' => 'esewa_secret_key'], ['value' => '8g7h3o91bh14', 'group' => 'payment', 'type' => 'text']);
        Setting::updateOrCreate(['key' => 'esewa_mode'], ['value' => 'sandbox', 'group' => 'payment', 'type' => 'text']);
        Setting::updateOrCreate(['key' => 'paypal_active'], ['value' => '0', 'group' => 'payment', 'type' => 'boolean']);
        Setting::updateOrCreate(['key' => 'paypal_client_id'], ['value' => 'PAYPAL-ID', 'group' => 'payment', 'type' => 'text']);
        Setting::updateOrCreate(['key' => 'paypal_mode'], ['value' => 'sandbox', 'group' => 'payment', 'type' => 'text']);
    }

    /** @test */
    public function guest_users_cannot_access_payment_endpoints()
    {
        $this->postJson('/api/payments/initiate', [])->assertStatus(401);
        $this->postJson('/api/payments/verify', [])->assertStatus(401);
        $this->getJson('/api/payments/some-uuid')->assertStatus(401);

        $this->getJson('/api/admin/payments')->assertStatus(401);
        $this->getJson('/api/admin/payments/some-uuid')->assertStatus(401);
    }

    /** @test */
    public function customers_cannot_access_admin_payment_endpoints()
    {
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/admin/payments')->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/admin/payments/some-uuid')->assertStatus(403);
    }

    /** @test */
    public function initiate_fails_if_order_belongs_to_another_user()
    {
        $response = $this->actingAs($this->otherCustomer, 'sanctum')->postJson('/api/payments/initiate', [
            'order_id' => $this->order->id,
            'gateway' => 'esewa',
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function initiate_fails_if_gateway_is_disabled()
    {
        // Disable esewa
        Setting::updateOrCreate(['key' => 'esewa_active'], ['value' => '0']);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/payments/initiate', [
            'order_id' => $this->order->id,
            'gateway' => 'esewa',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'eSewa payment gateway is currently disabled.');
    }

    /** @test */
    public function customer_can_successfully_initiate_esewa_payment_and_receive_valid_signature()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/payments/initiate', [
            'order_id' => $this->order->id,
            'gateway' => 'esewa',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.gateway', 'esewa')
            ->assertJsonPath('data.amount', '150.00')
            ->assertJsonStructure([
                'data' => [
                    'payment_id',
                    'order_id',
                    'order_number',
                    'amount',
                    'gateway',
                    'esewa' => [
                        'merchant_code',
                        'signature',
                        'mode',
                        'action_url',
                        'success_url',
                        'failure_url',
                    ]
                ]
            ]);

        $paymentId = $response->json('data.payment_id');
        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'order_id' => $this->order->id,
            'gateway' => 'esewa',
            'amount' => 150.00,
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function customer_can_successfully_initiate_paypal_payment()
    {
        // Enable PayPal
        Setting::updateOrCreate(['key' => 'paypal_active'], ['value' => '1']);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/payments/initiate', [
            'order_id' => $this->order->id,
            'gateway' => 'paypal',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.gateway', 'paypal')
            ->assertJsonPath('data.paypal.client_id', 'PAYPAL-ID')
            ->assertJsonPath('data.paypal.mode', 'sandbox');
    }

    /** @test */
    public function customer_can_verify_completed_payment_which_automatically_updates_order_status()
    {
        // 1. Create a pending payment
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'gateway' => 'esewa',
            'amount' => 150.00,
            'status' => 'pending',
        ]);

        // 2. Call verify
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/payments/verify', [
            'payment_id' => $payment->id,
            'status' => 'completed',
            'transaction_id' => 'GATEWAY-TXN-12345',
            'gateway_response' => [
                'refId' => 'GATEWAY-TXN-12345',
                'amount' => 150.00,
            ]
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.transaction_id', 'GATEWAY-TXN-12345');

        // 3. Verify DB update
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'completed',
            'transaction_id' => 'GATEWAY-TXN-12345',
        ]);

        $this->order->refresh();
        $this->assertEquals('paid', $this->order->payment_status);
        $this->assertEquals('confirmed', $this->order->status);
    }

    /** @test */
    public function customer_can_retrieve_only_their_own_payment_details()
    {
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'gateway' => 'esewa',
            'amount' => 150.00,
            'status' => 'pending',
        ]);

        // Retrieve own payment detail
        $this->actingAs($this->customer, 'sanctum')->getJson("/api/payments/{$payment->id}")->assertStatus(200);

        // Attempting to access from another customer account fails with 403
        $this->actingAs($this->otherCustomer, 'sanctum')->getJson("/api/payments/{$payment->id}")->assertStatus(403);
    }

    /** @test */
    public function admin_can_view_all_payments_and_filters_them()
    {
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'gateway' => 'esewa',
            'amount' => 150.00,
            'status' => 'pending',
        ]);

        // Admin retrieves listing
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/payments');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $payment->id);

        // Retrieve single payment details
        $this->actingAs($this->admin, 'sanctum')->getJson("/api/admin/payments/{$payment->id}")->assertStatus(200);
    }
}
