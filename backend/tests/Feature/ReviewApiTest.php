<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $otherCustomer;
    protected Product $product;
    protected ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Buyer One',
            'email' => 'buyer@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $this->otherCustomer = User::create([
            'name' => 'Buyer Two',
            'email' => 'buyer2@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $this->product = Product::create([
            'name' => 'Tea Bags',
            'slug' => 'tea-bags',
            'is_active' => true,
        ]);

        $this->variant = $this->product->variants()->create([
            'variant_name' => '25 pack',
            'sku' => 'TEA-25',
            'retail_price' => 510,
            'wholesale_price' => 400,
            'stock' => 20,
            'is_active' => true,
        ]);
    }

    protected function createPaidOrderFor(User $user): Order
    {
        $order = Order::create([
            'user_id' => $user->id,
            'order_number' => 'ORD-' . uniqid(),
            'user_type' => 'retail',
            'subtotal' => 510,
            'discount_amount' => 0,
            'total' => 510,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'shipping_address' => [
                'street' => '1 Main',
                'city' => 'KTM',
                'state' => 'Bagmati',
                'zip' => '44600',
                'country' => 'Nepal',
            ],
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'variant_id' => $this->variant->id,
            'quantity' => 1,
            'unit_price' => 510,
            'discount_amount' => 0,
            'line_total' => 510,
        ]);

        return $order;
    }

    /** @test */
    public function guests_can_list_product_reviews()
    {
        Review::create([
            'user_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'rating' => 5,
            'message' => 'Excellent product, fast delivery.',
        ]);

        $response = $this->getJson('/api/products/tea-bags/reviews');

        $response->assertStatus(200)
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.average_rating', 5)
            ->assertJsonCount(1, 'data.reviews');
    }

    /** @test */
    public function product_can_be_fetched_by_slug_or_uuid()
    {
        $this->getJson('/api/products/tea-bags')->assertStatus(200)
            ->assertJsonPath('data.slug', 'tea-bags');

        $this->getJson('/api/products/' . $this->product->id)->assertStatus(200)
            ->assertJsonPath('data.id', $this->product->id);
    }

    /** @test */
    public function user_cannot_review_without_purchase()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/products/tea-bags/reviews', [
            'rating' => 5,
            'message' => 'Great tea, would buy again.',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'You can only review products you have fully purchased.');
    }

    /** @test */
    public function user_can_review_after_paid_purchase()
    {
        $this->createPaidOrderFor($this->customer);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/products/tea-bags/reviews', [
            'rating' => 4,
            'message' => 'Very good quality tea bags.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.rating', 4);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'rating' => 4,
        ]);
    }

    /** @test */
    public function user_can_only_leave_one_review_per_product()
    {
        $this->createPaidOrderFor($this->customer);

        $this->actingAs($this->customer, 'sanctum')->postJson('/api/products/tea-bags/reviews', [
            'rating' => 5,
            'message' => 'First review for this product.',
        ])->assertStatus(201);

        $this->actingAs($this->customer, 'sanctum')->postJson('/api/products/tea-bags/reviews', [
            'rating' => 3,
            'message' => 'Trying to post a second review.',
        ])->assertStatus(422)
            ->assertJsonPath('message', 'You have already reviewed this product.');
    }

    /** @test */
    public function review_rating_must_be_between_1_and_5()
    {
        $this->createPaidOrderFor($this->customer);

        $this->actingAs($this->customer, 'sanctum')->postJson('/api/products/tea-bags/reviews', [
            'rating' => 6,
            'message' => 'Invalid rating test message.',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }
}
