<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $customer;

    protected function setUp(): void
    {
        parent::setUp();
        
        Storage::fake('public');

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->customer = User::create([
            'name' => 'Customer User',
            'email' => 'customer@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);
    }

    /** @test */
    public function an_admin_can_create_a_category()
    {
        $image = UploadedFile::fake()->create('beverages.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/categories', [
            'name' => 'Beverages',
            'description' => 'Cold & Hot Drinks',
            'image' => $image,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Beverages')
            ->assertJsonPath('data.slug', 'beverages');

        $category = Category::first();
        $this->assertNotNull($category->image_url);
        Storage::disk('public')->assertExists('categories/' . $image->hashName());
    }

    /** @test */
    public function an_admin_can_create_a_hierarchical_category()
    {
        $parent = Category::create([
            'name' => 'Beverages',
            'slug' => 'beverages',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/categories', [
            'name' => 'Cold Drinks',
            'parent_id' => $parent->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.parent_id', $parent->id);

        $this->assertDatabaseHas('categories', [
            'name' => 'Cold Drinks',
            'parent_id' => $parent->id,
        ]);
    }

    /** @test */
    public function non_admins_cannot_create_categories()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/admin/categories', [
            'name' => 'Intruder Category',
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function users_can_list_categories_publicly()
    {
        Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        Category::create(['name' => 'Snacks', 'slug' => 'snacks']);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function an_admin_can_create_a_product_with_multiple_categories_and_variants()
    {
        $cat1 = Category::create(['name' => 'Snacks', 'slug' => 'snacks']);
        $cat2 = Category::create(['name' => 'Organic', 'slug' => 'organic']);

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Premium Potato Chips',
            'description' => 'Salted organic potato chips',
            'category_ids' => [$cat1->id, $cat2->id],
            'variants' => [
                [
                    'variant_name' => '100g Bag',
                    'sku' => 'CHIPS-100G',
                    'retail_price' => 2.50,
                    'wholesale_price' => 1.80,
                    'international_price' => 3.25,
                    'moq' => 10,
                    'stock' => 100,
                ],
                [
                    'variant_name' => '250g Family Bag',
                    'sku' => 'CHIPS-250G',
                    'retail_price' => 5.00,
                    'wholesale_price' => 3.50,
                    'moq' => 5,
                    'stock' => 50,
                ]
            ]
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Premium Potato Chips')
            ->assertJsonCount(2, 'data.categories')
            ->assertJsonCount(2, 'data.variants');

        $this->assertDatabaseHas('products', ['name' => 'Premium Potato Chips']);
        $response->assertJsonPath('data.variants.0.international_price', '3.25');
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'CHIPS-100G',
            'international_price' => 3.25,
        ]);
        $this->assertDatabaseHas('product_variants', ['sku' => 'CHIPS-250G']);
    }

    /** @test */
    public function updating_a_product_validates_sku_uniqueness_excluding_itself()
    {
        $product = Product::create(['name' => 'Chips', 'slug' => 'chips']);
        $variant = $product->variants()->create([
            'variant_name' => '100g',
            'sku' => 'CHIPS-100',
            'retail_price' => 2.00,
            'wholesale_price' => 1.50,
        ]);

        // Trying to update the variant with its own SKU should pass
        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'name' => 'Chips Redesigned',
            'variants' => [
                [
                    'id' => $variant->id,
                    'variant_name' => '100g Classic',
                    'sku' => 'CHIPS-100', // same SKU
                    'retail_price' => 2.20,
                    'wholesale_price' => 1.60,
                    'international_price' => 2.80,
                ]
            ]
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.variants.0.international_price', '2.80');
        $this->assertDatabaseHas('product_variants', [
            'id' => $variant->id,
            'international_price' => 2.80,
        ]);

        // Trying to create or update another variant with an already taken SKU should fail
        $product2 = Product::create(['name' => 'Popcorn', 'slug' => 'popcorn']);
        
        $response2 = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/products/{$product2->id}", [
            'variants' => [
                [
                    'variant_name' => 'Popcorn Medium',
                    'sku' => 'CHIPS-100', // Conflict!
                    'retail_price' => 3.00,
                    'wholesale_price' => 2.00,
                ]
            ]
        ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['variants.0.sku']);
    }

    /** @test */
    public function an_admin_can_create_and_update_product_with_separate_discount_fields()
    {
        $category = Category::create(['name' => 'Deals', 'slug' => 'deals']);
        $startsAt = now()->subDay()->toDateTimeString();
        $endsAt = now()->addDay()->toDateTimeString();

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Discount Matrix',
            'category_ids' => [$category->id],
            'discount' => [
                'type' => 'percent',
                'value' => 10,
                'international_type' => 'fixed',
                'international_value' => 2.50,
                'wholesale_type' => 'fixed',
                'wholesale_value' => 75,
                'wholesale_international_type' => 'percent',
                'wholesale_international_value' => 5,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'is_active' => true,
            ],
            'variants' => [
                [
                    'variant_name' => 'Box',
                    'sku' => 'DISCOUNT-BOX',
                    'retail_price' => 1000,
                    'wholesale_price' => 800,
                    'international_price' => 12,
                    'stock' => 20,
                    'discount' => [
                        'type' => 'fixed',
                        'value' => 100,
                        'international_type' => 'percent',
                        'international_value' => 10,
                        'wholesale_type' => 'percent',
                        'wholesale_value' => 15,
                        'wholesale_international_type' => 'fixed',
                        'wholesale_international_value' => 1,
                        'starts_at' => $startsAt,
                        'ends_at' => $endsAt,
                    ],
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.discounts.0.type', 'percent')
            ->assertJsonPath('data.discounts.0.international_type', 'fixed')
            ->assertJsonPath('data.discounts.0.wholesale_type', 'fixed')
            ->assertJsonPath('data.discounts.0.wholesale_international_type', 'percent')
            ->assertJsonPath('data.variants.0.discounts.0.type', 'fixed')
            ->assertJsonPath('data.variants.0.discounts.0.international_type', 'percent')
            ->assertJsonPath('data.variants.0.discounts.0.wholesale_type', 'percent')
            ->assertJsonPath('data.variants.0.discounts.0.wholesale_international_type', 'fixed');

        $product = Product::where('slug', 'discount-matrix')->firstOrFail();
        $variant = $product->variants()->firstOrFail();

        $this->assertDatabaseHas('discounts', [
            'product_id' => $product->id,
            'variant_id' => null,
            'type' => 'percent',
            'value' => 10,
            'international_type' => 'fixed',
            'international_value' => 2.50,
            'wholesale_type' => 'fixed',
            'wholesale_value' => 75,
            'wholesale_international_type' => 'percent',
            'wholesale_international_value' => 5,
        ]);

        $this->assertDatabaseHas('discounts', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'type' => 'fixed',
            'value' => 100,
            'international_type' => 'percent',
            'international_value' => 10,
            'wholesale_type' => 'percent',
            'wholesale_value' => 15,
            'wholesale_international_type' => 'fixed',
            'wholesale_international_value' => 1,
        ]);

        $updateResponse = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'name' => 'Discount Matrix Updated',
            'discount' => [
                'wholesale_type' => 'fixed',
                'wholesale_value' => 50,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
            ],
            'variants' => [
                [
                    'id' => $variant->id,
                    'variant_name' => 'Box Updated',
                    'sku' => 'DISCOUNT-BOX',
                    'retail_price' => 1100,
                    'wholesale_price' => 850,
                    'international_price' => 13,
                    'discount' => [
                        'international_type' => 'fixed',
                        'international_value' => 1.25,
                        'starts_at' => $startsAt,
                        'ends_at' => $endsAt,
                    ],
                ],
            ],
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.discounts.0.type', null)
            ->assertJsonPath('data.discounts.0.wholesale_type', 'fixed')
            ->assertJsonPath('data.discounts.0.wholesale_value', '50.00')
            ->assertJsonPath('data.variants.0.discounts.0.type', null)
            ->assertJsonPath('data.variants.0.discounts.0.international_type', 'fixed')
            ->assertJsonPath('data.variants.0.discounts.0.international_value', '1.25');

        $this->assertDatabaseHas('discounts', [
            'product_id' => $product->id,
            'variant_id' => null,
            'type' => null,
            'value' => null,
            'wholesale_type' => 'fixed',
            'wholesale_value' => 50,
        ]);

        $this->assertDatabaseHas('discounts', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'type' => null,
            'value' => null,
            'international_type' => 'fixed',
            'international_value' => 1.25,
        ]);
    }

    /** @test */
    public function users_can_search_and_filter_products_publicly()
    {
        $cat = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        $prod1 = Product::create(['name' => 'Coca Cola', 'slug' => 'coca-cola']);
        $prod1->categories()->attach($cat->id);

        $prod2 = Product::create(['name' => 'Potato Chips', 'slug' => 'potato-chips']);

        // Search filter
        $responseSearch = $this->getJson('/api/products?search=Cola');
        $responseSearch->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Coca Cola');

        // Category filter
        $responseCat = $this->getJson('/api/products?category_slug=beverages');
        $responseCat->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Coca Cola');
    }

    /** @test */
    public function an_admin_can_upload_and_delete_product_images_locally()
    {
        $product = Product::create(['name' => 'Coca Cola', 'slug' => 'coca-cola']);
        $image = UploadedFile::fake()->create('coke.jpg', 100, 'image/jpeg');

        // Upload
        $response = $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/products/{$product->id}/images", [
            'image' => $image,
            'is_primary' => true,
        ]);

        $response->assertStatus(201);
        
        $productImage = $product->images()->first();
        $this->assertNotNull($productImage);
        Storage::disk('public')->assertExists('products/' . $image->hashName());

        // Delete image
        $deleteResponse = $this->actingAs($this->admin, 'sanctum')->deleteJson("/api/admin/products/images/{$productImage->id}");
        $deleteResponse->assertStatus(200);

        Storage::disk('public')->assertMissing('products/' . $image->hashName());
    }
}
