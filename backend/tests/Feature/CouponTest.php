<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Coupon\CouponValidationService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;
    protected User $wholesaler;
    protected Product $product;
    protected ProductVariant $variant;
    protected Category $category;
    protected Brand $brand;
    protected CouponValidationService $validationService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->validationService = app(CouponValidationService::class);

        $this->admin = User::create([
            'name' => 'Admin Owner',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->customer = User::create([
            'name' => 'Retail Customer',
            'email' => 'customer@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $this->wholesaler = User::create([
            'name' => 'Wholesale Partner',
            'email' => 'wholesale@example.com',
            'password' => bcrypt('password123'),
            'role' => 'wholesaler',
        ]);

        $this->brand = Brand::create([
            'name' => 'Acme Foods',
            'slug' => 'acme-foods',
        ]);

        $this->category = Category::create([
            'name' => 'Snacks',
            'slug' => 'snacks',
        ]);

        $this->product = Product::create([
            'name' => 'Potato Chips',
            'slug' => 'potato-chips',
            'brand_id' => $this->brand->id,
        ]);
        $this->product->categories()->attach($this->category->id);

        $this->variant = $this->product->variants()->create([
            'variant_name' => '100g Pack',
            'sku' => 'CHIPS-100',
            'retail_price' => 200.00,
            'wholesale_price' => 160.00,
            'stock' => 50,
            'is_active' => true,
        ]);
    }

    /** @test */
    public function secure_coupon_codes_are_generated_with_safe_characters_and_are_unique()
    {
        $couponA = $this->makeCoupon(['name' => 'Coupon A']);
        $couponB = $this->makeCoupon(['name' => 'Coupon B']);

        $this->assertMatchesRegularExpression('/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/', $couponA->secure_code);
        $this->assertSame(16, strlen($couponA->secure_code));
        $this->assertNotSame($couponA->secure_code, $couponB->secure_code);
        $this->assertNotSame($couponA->customer_code, $couponB->customer_code);
    }

    /** @test */
    public function manual_customer_codes_are_preserved_and_normalized()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Manual Coupon',
            'customer_code' => 'summer2026',
        ]);

        $this->assertSame('SUMMER2026', $coupon->customer_code);
        $this->assertDatabaseHas('coupons', [
            'id' => $coupon->id,
            'customer_code' => 'SUMMER2026',
        ]);
    }

    /** @test */
    public function duplicate_customer_codes_are_rejected_by_the_database()
    {
        $this->makeCoupon([
            'name' => 'First Coupon',
            'customer_code' => 'SAVE10',
        ]);

        $this->expectException(QueryException::class);

        $this->makeCoupon([
            'name' => 'Second Coupon',
            'customer_code' => 'SAVE10',
        ]);
    }

    /** @test */
    public function inactive_coupons_fail_validation()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Inactive Coupon',
            'status' => 'inactive',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $result = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertFalse($result['success']);
        $this->assertSame('Coupon is inactive.', $result['message']);
    }

    /** @test */
    public function future_start_dates_and_expired_coupons_fail_validation()
    {
        $futureCoupon = $this->makeCoupon([
            'name' => 'Future Coupon',
            'starts_at' => now()->addDay(),
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $expiredCoupon = $this->makeCoupon([
            'name' => 'Expired Coupon',
            'expires_at' => now()->subDay(),
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $futureResult = $this->validationService->validateCoupon([
            'code' => $futureCoupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $expiredResult = $this->validationService->validateCoupon([
            'code' => $expiredCoupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertFalse($futureResult['success']);
        $this->assertSame('Coupon has not started yet.', $futureResult['message']);
        $this->assertFalse($expiredResult['success']);
        $this->assertSame('Coupon has expired.', $expiredResult['message']);
    }

    /** @test */
    public function usage_limits_and_per_customer_limits_are_enforced()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Usage Limited Coupon',
            'usage_limit' => 1,
            'usage_per_user' => 1,
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $order = $this->createOrderFor($this->customer);
        CouponRedemption::create([
            'coupon_id' => $coupon->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'currency' => 'USD',
            'subtotal' => 500,
            'discount_amount' => 50,
            'redeemed_at' => now(),
        ]);

        $result = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertFalse($result['success']);
        $this->assertSame('Coupon usage limit has been reached.', $result['message']);
    }

    /** @test */
    public function usage_per_user_limit_is_enforced_independently_of_global_limit()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Per Customer Usage Coupon',
            'usage_limit' => 5,
            'usage_per_user' => 1,
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $order = $this->createOrderFor($this->customer);
        CouponRedemption::create([
            'coupon_id' => $coupon->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'currency' => 'USD',
            'subtotal' => 500,
            'discount_amount' => 50,
            'redeemed_at' => now(),
        ]);

        $sameCustomerResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $otherCustomer = User::create([
            'name' => 'Other Eligible Customer',
            'email' => 'other-eligible@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $otherCustomerResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $otherCustomer);

        $this->assertFalse($sameCustomerResult['success']);
        $this->assertSame('Coupon usage limit for this customer has been reached.', $sameCustomerResult['message']);
        $this->assertTrue($otherCustomerResult['success']);
    }

    /** @test */
    public function customer_type_and_customer_specific_coupons_are_enforced()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Wholesale Only',
            'customer_type' => 'wholesale',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ], [], [$this->wholesaler->id]);

        $customerResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $wholesalerResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->wholesaler);

        $this->assertFalse($customerResult['success']);
        $this->assertSame('Coupon is not available for this customer type.', $customerResult['message']);
        $this->assertTrue($wholesalerResult['success']);
    }

    /** @test */
    public function regional_rules_validate_market_currency_and_minimum_subtotal()
    {
        $npCoupon = $this->makeCoupon([
            'name' => 'Nepal Coupon',
        ], [
            'market' => 'NP',
            'currency' => 'NPR',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'minimum_subtotal' => 1000,
        ]);

        $intCoupon = $this->makeCoupon([
            'name' => 'International Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 25,
            'minimum_subtotal' => 100,
        ]);

        $npResult = $this->validationService->validateCoupon([
            'code' => $npCoupon->customer_code,
            'subtotal' => 1200,
            'shipping_address' => ['country' => 'Nepal'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $intResult = $this->validationService->validateCoupon([
            'code' => $intCoupon->customer_code,
            'subtotal' => 150,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $minimumSubtotalFail = $this->validationService->validateCoupon([
            'code' => $npCoupon->customer_code,
            'subtotal' => 900,
            'shipping_address' => ['country' => 'Nepal'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertTrue($npResult['success']);
        $this->assertSame('120.00', $npResult['data']['discount_amount']);
        $this->assertTrue($intResult['success']);
        $this->assertSame('25.00', $intResult['data']['discount_amount']);
        $this->assertFalse($minimumSubtotalFail['success']);
        $this->assertSame('Cart subtotal does not meet the minimum required amount.', $minimumSubtotalFail['message']);
    }

    /** @test */
    public function explicit_currency_must_match_the_selected_region_rule()
    {
        $usdCoupon = $this->makeCoupon([
            'name' => 'International USD Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'customer_type' => 'all',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'minimum_subtotal' => 200,
        ]);

        $usdResult = $this->validationService->validateCoupon([
            'code' => $usdCoupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'currency' => 'USD',
            'items' => $this->couponItems(),
        ], $this->customer);

        $lowercaseUsdResponse = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/coupons/validate', [
                'code' => $usdCoupon->customer_code,
                'subtotal' => 500,
                'shipping_address' => ['country' => 'USA'],
                'currency' => 'usd',
                'items' => $this->couponItems(),
            ]);

        $nprMismatchResult = $this->validationService->validateCoupon([
            'code' => $usdCoupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'USA'],
            'currency' => 'NPR',
            'items' => $this->couponItems(),
        ], $this->customer);

        $nprCoupon = $this->makeCoupon([
            'name' => 'Nepal NPR Coupon',
        ], [
            'market' => 'NP',
            'currency' => 'NPR',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $usdMismatchResult = $this->validationService->validateCoupon([
            'code' => $nprCoupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'Nepal'],
            'currency' => 'USD',
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertTrue($usdResult['success']);
        $this->assertSame('50.00', $usdResult['data']['discount_amount']);
        $this->assertSame('USD', $usdResult['data']['applied_rule']['currency']);
        $this->assertSame('INT', $usdResult['data']['applied_rule']['market']);

        $lowercaseUsdResponse->assertStatus(200)
            ->assertJsonPath('data.discount_amount', '50.00')
            ->assertJsonPath('data.applied_rule.currency', 'USD')
            ->assertJsonPath('data.applied_rule.market', 'INT');

        $this->assertFalse($nprMismatchResult['success']);
        $this->assertSame('This coupon is not valid for the selected currency or market.', $nprMismatchResult['message']);

        $this->assertFalse($usdMismatchResult['success']);
        $this->assertSame('This coupon is not valid for the selected currency or market.', $usdMismatchResult['message']);
    }

    /** @test */
    public function cod_currency_selection_uses_request_currency_not_payment_method()
    {
        $coupon = $this->makeCoupon([
            'name' => 'COD Multi Currency Coupon',
            'payment_methods' => ['cod'],
        ]);

        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'NPR',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);
        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 20,
        ]);

        $nprResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 1000,
            'shipping_address' => ['country' => 'Nepal'],
            'currency' => 'NPR',
            'payment_method' => 'cod',
            'items' => $this->couponItems(),
        ], $this->customer);

        $usdResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 200,
            'shipping_address' => ['country' => 'Nepal'],
            'currency' => 'USD',
            'payment_method' => 'cod',
            'items' => $this->couponItems(),
        ], $this->customer);

        $blockedPaymentResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 200,
            'shipping_address' => ['country' => 'Nepal'],
            'currency' => 'USD',
            'payment_method' => 'paypal',
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertTrue($nprResult['success']);
        $this->assertSame('100.00', $nprResult['data']['discount_amount']);
        $this->assertSame('NPR', $nprResult['data']['applied_rule']['currency']);

        $this->assertTrue($usdResult['success']);
        $this->assertSame('20.00', $usdResult['data']['discount_amount']);
        $this->assertSame('USD', $usdResult['data']['applied_rule']['currency']);

        $this->assertFalse($blockedPaymentResult['success']);
        $this->assertSame('Coupon is not valid for the selected payment method.', $blockedPaymentResult['message']);
    }

    /** @test */
    public function cod_npr_coupon_requires_an_npr_rule()
    {
        $coupon = $this->makeCoupon([
            'name' => 'COD USD Only Coupon',
            'payment_methods' => ['cod'],
        ]);

        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 20,
        ]);

        $usdResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'Nepal'],
            'currency' => 'USD',
            'payment_method' => 'cod',
            'items' => $this->couponItems(),
        ], $this->customer);

        $nprResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 500,
            'shipping_address' => ['country' => 'Nepal'],
            'currency' => 'NPR',
            'payment_method' => 'cod',
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertTrue($usdResult['success']);
        $this->assertSame('20.00', $usdResult['data']['discount_amount']);
        $this->assertSame('USD', $usdResult['data']['applied_rule']['currency']);

        $this->assertFalse($nprResult['success']);
        $this->assertSame('This coupon is not valid for the selected currency or market.', $nprResult['message']);
    }

    /** @test */
    public function payment_method_allow_lists_are_independent_from_currency_rules()
    {
        $cases = [
            [['cod'], 'cod', 'esewa', 'USD', '20.00'],
            [['esewa'], 'esewa', 'paypal', 'NPR', '100.00'],
            [['paypal'], 'paypal', 'cod', 'USD', '20.00'],
            [['cod', 'esewa'], 'esewa', 'paypal', 'NPR', '100.00'],
        ];

        foreach ($cases as [$paymentMethods, $allowedMethod, $blockedMethod, $currency, $expectedDiscount]) {
            $coupon = $this->makeCoupon([
                'name' => 'Payment Restriction Coupon',
                'payment_methods' => $paymentMethods,
            ]);

            $this->addCouponRule($coupon, [
                'market' => 'NP',
                'currency' => 'NPR',
                'discount_type' => 'percentage',
                'discount_value' => 10,
            ]);
            $this->addCouponRule($coupon, [
                'market' => 'NP',
                'currency' => 'USD',
                'discount_type' => 'fixed',
                'discount_value' => 20,
            ]);

            $allowedResult = $this->validationService->validateCoupon([
                'code' => $coupon->customer_code,
                'subtotal' => $currency === 'NPR' ? 1000 : 200,
                'shipping_address' => ['country' => 'Nepal'],
                'currency' => $currency,
                'payment_method' => $allowedMethod,
                'items' => $this->couponItems(),
            ], $this->customer);

            $blockedResult = $this->validationService->validateCoupon([
                'code' => $coupon->customer_code,
                'subtotal' => $currency === 'NPR' ? 1000 : 200,
                'shipping_address' => ['country' => 'Nepal'],
                'currency' => $currency,
                'payment_method' => $blockedMethod,
                'items' => $this->couponItems(),
            ], $this->customer);

            $this->assertTrue($allowedResult['success']);
            $this->assertSame($expectedDiscount, $allowedResult['data']['discount_amount']);
            $this->assertFalse($blockedResult['success']);
            $this->assertSame('Coupon is not valid for the selected payment method.', $blockedResult['message']);
        }

        foreach ([null, []] as $paymentMethods) {
            $coupon = $this->makeCoupon([
                'name' => 'All Payment Methods Coupon',
                'payment_methods' => $paymentMethods,
            ]);

            $this->addCouponRule($coupon, [
                'market' => 'NP',
                'currency' => 'NPR',
                'discount_type' => 'percentage',
                'discount_value' => 10,
            ]);
            $this->addCouponRule($coupon, [
                'market' => 'NP',
                'currency' => 'USD',
                'discount_type' => 'fixed',
                'discount_value' => 20,
            ]);

            foreach ([['cod', 'USD', '20.00'], ['esewa', 'NPR', '100.00'], ['paypal', 'USD', '20.00']] as [$paymentMethod, $currency, $expectedDiscount]) {
                $result = $this->validationService->validateCoupon([
                    'code' => $coupon->customer_code,
                    'subtotal' => $currency === 'NPR' ? 1000 : 200,
                    'shipping_address' => ['country' => 'Nepal'],
                    'currency' => $currency,
                    'payment_method' => $paymentMethod,
                    'items' => $this->couponItems(),
                ], $this->customer);

                $this->assertTrue($result['success']);
                $this->assertSame($expectedDiscount, $result['data']['discount_amount']);
            }
        }
    }

    /** @test */
    public function same_coupon_code_can_select_currency_and_customer_type_specific_rules()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Role Currency Matrix Coupon',
            'payment_methods' => ['cod', 'esewa', 'paypal'],
        ]);

        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'NPR',
            'customer_type' => 'customer',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);
        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'USD',
            'customer_type' => 'customer',
            'discount_type' => 'fixed',
            'discount_value' => 20,
        ]);
        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'NPR',
            'customer_type' => 'wholesaler',
            'discount_type' => 'percentage',
            'discount_value' => 5,
        ]);
        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'USD',
            'customer_type' => 'wholesaler',
            'discount_type' => 'fixed',
            'discount_value' => 10,
        ]);

        $cases = [
            [$this->customer, 'cod', 'NPR', 1000, '100.00', 'customer'],
            [$this->customer, 'cod', 'USD', 200, '20.00', 'customer'],
            [$this->wholesaler, 'cod', 'NPR', 1000, '50.00', 'wholesaler'],
            [$this->wholesaler, 'cod', 'USD', 200, '10.00', 'wholesaler'],
            [$this->customer, 'esewa', 'NPR', 1000, '100.00', 'customer'],
            [$this->customer, 'paypal', 'USD', 200, '20.00', 'customer'],
        ];

        foreach ($cases as [$user, $paymentMethod, $currency, $subtotal, $expectedDiscount, $expectedCustomerType]) {
            $result = $this->validationService->validateCoupon([
                'code' => $coupon->customer_code,
                'subtotal' => $subtotal,
                'shipping_address' => ['country' => 'Nepal'],
                'currency' => $currency,
                'payment_method' => $paymentMethod,
                'items' => $this->couponItems(),
            ], $user);

            $this->assertTrue($result['success']);
            $this->assertSame($expectedDiscount, $result['data']['discount_amount']);
            $this->assertSame($currency, $result['data']['applied_rule']['currency']);
            $this->assertSame($expectedCustomerType, $result['data']['applied_rule']['customer_type']);
        }
    }

    /** @test */
    public function percentage_discounts_respect_the_maximum_discount_cap()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Capped Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'maximum_discount' => 50,
        ]);

        $result = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 400,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertTrue($result['success']);
        $this->assertSame('50.00', $result['data']['discount_amount']);
    }

    /** @test */
    public function fixed_discounts_are_calculated_correctly()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Fixed Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 30,
        ]);

        $result = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 400,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertTrue($result['success']);
        $this->assertSame('30.00', $result['data']['discount_amount']);
    }

    /** @test */
    public function bogo_promotions_discount_eligible_backend_priced_items()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Buy One Get One',
            'promotion_type' => 'bogo',
            'bogo_config' => [
                'buy_quantity' => 1,
                'get_quantity' => 1,
                'discount_type' => 'free',
            ],
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 0,
        ], [
            'product_ids' => [$this->product->id],
        ]);

        $result = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 400,
            'shipping_address' => ['country' => 'USA'],
            'items' => [[
                'product_id' => $this->product->id,
                'brand_id' => $this->brand->id,
                'category_ids' => [$this->category->id],
                'quantity' => 2,
                'unit_price' => 200,
            ]],
        ], $this->customer);

        $tooFewItems = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 200,
            'shipping_address' => ['country' => 'USA'],
            'items' => [[
                'product_id' => $this->product->id,
                'brand_id' => $this->brand->id,
                'category_ids' => [$this->category->id],
                'quantity' => 1,
                'unit_price' => 200,
            ]],
        ], $this->customer);

        $this->assertTrue($result['success']);
        $this->assertSame('200.00', $result['data']['discount_amount']);
        $this->assertSame('bogo', $result['data']['applied_promotion']['discount_strategy']);
        $this->assertFalse($tooFewItems['success']);
        $this->assertSame('Cart does not contain the required eligible items for this promotion.', $tooFewItems['message']);
    }

    /** @test */
    public function tiered_discounts_apply_the_highest_eligible_subtotal_tier()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Tiered Coupon',
            'promotion_type' => 'tiered',
            'tier_config' => [
                ['minimum_subtotal' => 1000, 'discount_type' => 'percentage', 'discount_value' => 5],
                ['minimum_subtotal' => 5000, 'discount_type' => 'percentage', 'discount_value' => 10],
                ['minimum_subtotal' => 10000, 'discount_type' => 'percentage', 'discount_value' => 15],
            ],
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 0,
        ]);

        $result = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 6000,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertTrue($result['success']);
        $this->assertSame('600.00', $result['data']['discount_amount']);
        $this->assertSame('5000.00', $result['data']['applied_promotion']['config']['minimum_subtotal']);
    }

    /** @test */
    public function payment_specific_coupons_only_validate_for_allowed_payment_methods()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Esewa Coupon',
            'promotion_type' => 'payment_specific',
            'payment_methods' => ['esewa'],
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $paypalResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 400,
            'shipping_address' => ['country' => 'USA'],
            'payment_method' => 'paypal',
            'items' => $this->couponItems(),
        ], $this->customer);

        $esewaResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 400,
            'shipping_address' => ['country' => 'USA'],
            'payment_method' => 'esewa',
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertFalse($paypalResult['success']);
        $this->assertSame('Coupon is not valid for the selected payment method.', $paypalResult['message']);
        $this->assertTrue($esewaResult['success']);
        $this->assertSame('40.00', $esewaResult['data']['discount_amount']);
    }

    /** @test */
    public function product_restrictions_still_gate_coupon_validation()
    {
        $otherBrand = Brand::create([
            'name' => 'Other Brand',
            'slug' => 'other-brand',
        ]);
        $otherCategory = Category::create([
            'name' => 'Other Category',
            'slug' => 'other-category',
        ]);
        $otherProduct = Product::create([
            'name' => 'Other Product',
            'slug' => 'other-product',
            'brand_id' => $otherBrand->id,
        ]);
        $otherProduct->categories()->attach($otherCategory->id);

        $coupon = $this->makeCoupon([
            'name' => 'Restricted Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ], [
            'product_ids' => [$this->product->id],
        ]);

        $blockedResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 200,
            'shipping_address' => ['country' => 'USA'],
            'items' => [[
                'product_id' => $otherProduct->id,
                'brand_id' => $otherBrand->id,
                'category_ids' => [$otherCategory->id],
                'quantity' => 1,
                'unit_price' => 200,
            ]],
        ], $this->customer);

        $allowedResult = $this->validationService->validateCoupon([
            'code' => $coupon->customer_code,
            'subtotal' => 200,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ], $this->customer);

        $this->assertFalse($blockedResult['success']);
        $this->assertSame('Coupon is not applicable to the selected items.', $blockedResult['message']);
        $this->assertTrue($allowedResult['success']);
    }

    /** @test */
    public function admin_can_create_edit_and_delete_advanced_coupons()
    {
        $createResponse = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/coupons', [
            'name' => 'Admin Tiered Coupon',
            'customer_code' => 'ADMINTIER',
            'promotion_type' => 'tiered',
            'usage_limit' => 8,
            'usage_per_user' => 2,
            'payment_methods' => [],
            'tier_config' => [
                ['minimum_subtotal' => 1000, 'discount_type' => 'percentage', 'discount_value' => 5],
            ],
            'region_rules' => [[
                'market' => 'INT',
                'currency' => 'USD',
                'customer_type' => 'customer',
                'discount_type' => 'fixed',
                'discount_value' => 0,
            ]],
        ]);

        $couponId = $createResponse->json('data.id');

        $createResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'Admin Tiered Coupon')
            ->assertJsonPath('data.coupon_code', 'ADMINTIER')
            ->assertJsonMissingPath('data.customer_code')
            ->assertJsonPath('data.promotion_type', 'tiered')
            ->assertJsonPath('data.usage_limit', 8)
            ->assertJsonPath('data.usage_per_user', 2)
            ->assertJsonPath('data.region_rules.0.customer_type', 'customer');

        $updateResponse = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/coupons/{$couponId}", [
            'description' => 'Updated from admin',
            'auto_apply' => true,
            'usage_limit' => 9,
            'usage_per_user' => 3,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.description', 'Updated from admin')
            ->assertJsonPath('data.auto_apply', true)
            ->assertJsonPath('data.usage_limit', 9)
            ->assertJsonPath('data.usage_per_user', 3);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/admin/coupons/{$couponId}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('coupons', ['id' => $couponId]);
    }

    /** @test */
    public function admin_can_create_custom_percentage_and_fixed_rules_for_each_currency_and_customer_type()
    {
        $cases = [
            ['NPR customer percentage', 'NP', 'NPR', 'customer', 'percentage', 12.5, 1000, '125.00'],
            ['NPR customer fixed', 'NP', 'NPR', 'customer', 'fixed', 137, 1000, '137.00'],
            ['USD customer percentage', 'INT', 'USD', 'customer', 'percentage', 17.5, 200, '35.00'],
            ['USD customer fixed', 'INT', 'USD', 'customer', 'fixed', 43, 200, '43.00'],
            ['NPR wholesaler percentage', 'NP', 'NPR', 'wholesaler', 'percentage', 7, 1000, '70.00'],
            ['NPR wholesaler fixed', 'NP', 'NPR', 'wholesaler', 'fixed', 263, 1000, '263.00'],
            ['USD wholesaler percentage', 'INT', 'USD', 'wholesaler', 'percentage', 8.5, 200, '17.00'],
            ['USD wholesaler fixed', 'INT', 'USD', 'wholesaler', 'fixed', 29, 200, '29.00'],
        ];

        foreach ($cases as [$name, $market, $currency, $customerType, $discountType, $discountValue, $subtotal, $expectedDiscount]) {
            $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/coupons', [
                'name' => $name,
                'payment_methods' => ['cod'],
                'usage_limit' => 19,
                'usage_per_user' => 3,
                'region_rules' => [[
                    'market' => $market,
                    'currency' => $currency,
                    'customer_type' => $customerType,
                    'discount_type' => $discountType,
                    'discount_value' => $discountValue,
                    'minimum_subtotal' => 11,
                    'maximum_discount' => $discountType === 'percentage' ? 999 : 1,
                    'free_shipping' => true,
                ]],
            ]);

            $response->assertCreated()
                ->assertJsonPath('data.payment_methods.0', 'cod')
                ->assertJsonPath('data.usage_limit', 19)
                ->assertJsonPath('data.usage_per_user', 3)
                ->assertJsonPath('data.region_rules.0.currency', $currency)
                ->assertJsonPath('data.region_rules.0.customer_type', $customerType)
                ->assertJsonPath('data.region_rules.0.discount_type', $discountType)
                ->assertJsonPath('data.region_rules.0.free_shipping', true);

            $coupon = Coupon::findOrFail($response->json('data.id'));
            $user = $customerType === 'wholesaler' ? $this->wholesaler : $this->customer;
            $result = $this->validationService->validateCoupon([
                'code' => $coupon->customer_code,
                'subtotal' => $subtotal,
                'shipping_address' => ['country' => $market === 'NP' ? 'Nepal' : 'USA'],
                'currency' => $currency,
                'payment_method' => 'cod',
                'items' => $this->couponItems(),
            ], $user);

            $this->assertTrue($result['success'], $name);
            $this->assertSame($expectedDiscount, $result['data']['discount_amount'], $name);
            $this->assertSame($discountType, $result['data']['applied_rule']['discount_type'], $name);
            $this->assertSame(number_format($discountValue, 2, '.', ''), $result['data']['applied_rule']['discount_value'], $name);
        }
    }

    /** @test */
    public function admin_updates_replace_rule_values_used_by_cod_without_currency_or_payment_defaults()
    {
        $createResponse = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/coupons', [
            'name' => 'Admin Managed COD Rules',
            'payment_methods' => ['cod'],
            'region_rules' => [
                [
                    'market' => 'NP',
                    'currency' => 'NPR',
                    'customer_type' => 'customer',
                    'discount_type' => 'fixed',
                    'discount_value' => 371,
                ],
                [
                    'market' => 'NP',
                    'currency' => 'USD',
                    'customer_type' => 'customer',
                    'discount_type' => 'percentage',
                    'discount_value' => 13,
                ],
            ],
        ])->assertCreated();

        $couponId = $createResponse->json('data.id');
        $couponCode = $createResponse->json('data.coupon_code');

        foreach ([['NPR', 1000, '371.00'], ['USD', 200, '26.00']] as [$currency, $subtotal, $expectedDiscount]) {
            $result = $this->validationService->validateCoupon([
                'code' => $couponCode,
                'subtotal' => $subtotal,
                'shipping_address' => ['country' => 'Nepal'],
                'currency' => $currency,
                'payment_method' => 'cod',
                'items' => $this->couponItems(),
            ], $this->customer);

            $this->assertTrue($result['success']);
            $this->assertSame($expectedDiscount, $result['data']['discount_amount']);
        }

        $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/coupons/{$couponId}", [
            'region_rules' => [
                [
                    'market' => 'NP',
                    'currency' => 'NPR',
                    'customer_type' => 'customer',
                    'discount_type' => 'percentage',
                    'discount_value' => 16,
                    'maximum_discount' => 140,
                ],
                [
                    'market' => 'NP',
                    'currency' => 'USD',
                    'customer_type' => 'customer',
                    'discount_type' => 'fixed',
                    'discount_value' => 47,
                ],
            ],
        ])->assertOk();

        foreach ([['NPR', 1000, '140.00'], ['USD', 200, '47.00']] as [$currency, $subtotal, $expectedDiscount]) {
            $result = $this->validationService->validateCoupon([
                'code' => $couponCode,
                'subtotal' => $subtotal,
                'shipping_address' => ['country' => 'Nepal'],
                'currency' => $currency,
                'payment_method' => 'cod',
                'items' => $this->couponItems(),
            ], $this->customer);

            $this->assertTrue($result['success']);
            $this->assertSame($expectedDiscount, $result['data']['discount_amount']);
        }
    }

    /** @test */
    public function coupon_api_responses_only_expose_coupon_code_and_prefer_it_as_input()
    {
        $createResponse = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/coupons', [
            'name' => 'Alias Coupon',
            'coupon_code' => 'alias10',
            'customer_code' => 'IGNORED10',
            'region_rules' => [[
                'market' => 'INT',
                'currency' => 'USD',
                'discount_type' => 'percentage',
                'discount_value' => 10,
            ]],
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.coupon_code', 'ALIAS10')
            ->assertJsonMissingPath('data.customer_code');

        $coupon = Coupon::findOrFail($createResponse->json('data.id'));
        $this->assertSame('ALIAS10', $coupon->customer_code);

        $legacyResponse = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/coupons', [
            'name' => 'Legacy Input Coupon',
            'customer_code' => 'legacy10',
            'region_rules' => [[
                'market' => 'INT',
                'currency' => 'USD',
                'discount_type' => 'fixed',
                'discount_value' => 15,
            ]],
        ]);

        $legacyResponse->assertCreated()
            ->assertJsonPath('data.coupon_code', 'LEGACY10')
            ->assertJsonMissingPath('data.customer_code');

        $this->assertDatabaseHas('coupons', [
            'id' => $legacyResponse->json('data.id'),
            'customer_code' => 'LEGACY10',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/coupons?search=ALIAS10')
            ->assertStatus(200)
            ->assertJsonPath('data.data.0.coupon_code', 'ALIAS10')
            ->assertJsonMissingPath('data.data.0.customer_code');

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/admin/coupons/{$coupon->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.coupon_code', 'ALIAS10')
            ->assertJsonMissingPath('data.customer_code');

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/coupons/{$coupon->id}", ['coupon_code' => 'updated10'])
            ->assertStatus(200)
            ->assertJsonPath('data.coupon_code', 'UPDATED10')
            ->assertJsonMissingPath('data.customer_code');

        $generatedResponse = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/coupons/generate-code', ['length' => 8]);

        $generatedResponse->assertStatus(200)
            ->assertJsonStructure(['data' => ['coupon_code']])
            ->assertJsonMissingPath('data.customer_code');

        $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/coupons/validate', [
                'coupon_code' => 'updated10',
                'subtotal' => 400,
                'shipping_address' => ['country' => 'USA'],
                'items' => $this->couponItems(),
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.coupon_code', 'UPDATED10')
            ->assertJsonMissingPath('data.customer_code');
    }

    /** @test */
    public function admin_partial_updates_preserve_existing_coupon_fields()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Original Coupon',
            'customer_code' => 'KEEP10',
            'description' => 'Original description',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/coupons/{$coupon->id}", [
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Original Coupon')
            ->assertJsonPath('data.coupon_code', 'KEEP10')
            ->assertJsonMissingPath('data.customer_code')
            ->assertJsonPath('data.description', 'Updated description');

        $this->assertDatabaseHas('coupons', [
            'id' => $coupon->id,
            'name' => 'Original Coupon',
            'customer_code' => 'KEEP10',
            'description' => 'Updated description',
        ]);
    }

    /** @test */
    public function checkout_recalculates_coupon_discount_and_records_redemption_history()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Checkout Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
            'coupon_code' => $coupon->customer_code,
            'currency' => 'USD',
            'notes' => 'Leave at reception',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.subtotal', '400.00')
            ->assertJsonPath('data.discount_amount', '40.00')
            ->assertJsonPath('data.total', '360.00');

        $order = Order::first();
        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $coupon->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'currency' => 'USD',
            'subtotal' => 400.00,
            'discount_amount' => 40.00,
        ]);
    }

    /** @test */
    public function checkout_recalculates_and_rejects_coupon_currency_mismatch()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Checkout USD Only Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'customer_type' => 'all',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'minimum_subtotal' => 200,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 3,
        ]);

        $payload = [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
            'coupon_code' => $coupon->customer_code,
        ];

        $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', array_merge($payload, [
            'currency' => 'NPR',
        ]))
            ->assertStatus(422)
            ->assertJsonPath('message', 'This coupon is not valid for the selected currency or market.');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('coupon_redemptions', 0);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', array_merge($payload, [
            'currency' => 'USD',
        ]));

        $response->assertStatus(201)
            ->assertJsonPath('data.subtotal', '600.00')
            ->assertJsonPath('data.discount_amount', '60.00')
            ->assertJsonPath('data.total', '540.00');

        $order = Order::first();
        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $coupon->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'currency' => 'USD',
            'subtotal' => 600.00,
            'discount_amount' => 60.00,
        ]);
    }

    /** @test */
    public function checkout_recalculates_cod_coupon_with_the_selected_currency()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Checkout COD USD Coupon',
            'payment_methods' => ['cod'],
        ]);

        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'NPR',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);
        $this->addCouponRule($coupon, [
            'market' => 'NP',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 20,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'Kathmandu',
                'state' => 'Bagmati',
                'zip' => '44600',
                'country' => 'Nepal',
            ],
            'coupon_code' => $coupon->customer_code,
            'payment_method' => 'cod',
            'currency' => 'USD',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.subtotal', '200.00')
            ->assertJsonPath('data.discount_amount', '20.00')
            ->assertJsonPath('data.total', '180.00');

        $order = Order::first();
        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $coupon->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'currency' => 'USD',
            'subtotal' => 200.00,
            'discount_amount' => 20.00,
        ]);
    }

    /** @test */
    public function checkout_with_cod_coupon_defaults_missing_currency_from_nepal_shipping_market()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Checkout COD NPR Fallback Coupon',
            'payment_methods' => ['cod'],
        ], [
            'market' => 'NP',
            'currency' => 'NPR',
            'discount_type' => 'fixed',
            'discount_value' => 31,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'Kathmandu',
                'state' => 'Bagmati',
                'zip' => '44600',
                'country' => 'Nepal',
            ],
            'coupon_code' => $coupon->customer_code,
            'payment_method' => 'cod',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.discount_amount', '31.00')
            ->assertJsonPath('data.total', '169.00');

        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $coupon->id,
            'currency' => 'NPR',
            'discount_amount' => 31.00,
        ]);
    }

    /** @test */
    public function checkout_revalidates_coupon_usage_limit_and_does_not_create_failed_redemptions()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Last Slot Coupon',
            'usage_limit' => 4,
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        for ($index = 1; $index <= 3; $index++) {
            $redeemedBy = User::create([
                'name' => "Historical Customer {$index}",
                'email' => "historical{$index}@example.com",
                'password' => bcrypt('password123'),
                'role' => 'customer',
            ]);
            $order = $this->createOrderFor($redeemedBy);

            CouponRedemption::create([
                'coupon_id' => $coupon->id,
                'user_id' => $redeemedBy->id,
                'order_id' => $order->id,
                'currency' => 'USD',
                'subtotal' => 400,
                'discount_amount' => 40,
                'redeemed_at' => now(),
            ]);
        }

        $secondCustomer = User::create([
            'name' => 'Second Checkout Customer',
            'email' => 'second-checkout@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
        ]);

        $previewPayload = [
            'code' => $coupon->customer_code,
            'subtotal' => 400,
            'shipping_address' => ['country' => 'USA'],
            'items' => $this->couponItems(),
        ];

        $this->assertTrue($this->validationService->validateCoupon($previewPayload, $this->customer)['success']);
        $this->assertTrue($this->validationService->validateCoupon($previewPayload, $secondCustomer)['success']);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
            'coupon_code' => $coupon->customer_code,
        ])->assertStatus(201);

        $this->assertSame(4, CouponRedemption::where('coupon_id', $coupon->id)->count());

        $secondCart = Cart::create(['user_id' => $secondCustomer->id]);
        $secondCart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $orderCountBeforeFailedCheckout = Order::count();
        $redemptionCountBeforeFailedCheckout = CouponRedemption::where('coupon_id', $coupon->id)->count();

        $this->actingAs($secondCustomer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '456 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
            'coupon_code' => $coupon->customer_code,
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Coupon usage limit has been reached.');

        $this->assertSame($orderCountBeforeFailedCheckout, Order::count());
        $this->assertSame(
            $redemptionCountBeforeFailedCheckout,
            CouponRedemption::where('coupon_id', $coupon->id)->count()
        );
    }

    /** @test */
    public function checkout_accepts_lowercase_coupon_codes_and_records_redemption_history()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Lowercase Checkout Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 25,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
            'coupon_code' => strtolower($coupon->customer_code),
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.discount_amount', '25.00')
            ->assertJsonPath('data.total', '175.00');

        $order = Order::first();
        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $coupon->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'discount_amount' => 25.00,
        ]);
    }

    /** @test */
    public function checkout_rechecks_payment_specific_coupons_against_the_selected_payment_method()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Checkout Payment Coupon',
            'promotion_type' => 'payment_specific',
            'payment_methods' => ['esewa'],
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
            'coupon_code' => $coupon->customer_code,
            'payment_method' => 'paypal',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Coupon is not valid for the selected payment method.');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('coupon_redemptions', 0);
    }

    /** @test */
    public function checkout_auto_applies_the_highest_discount_eligible_promotion()
    {
        $this->makeCoupon([
            'name' => 'Smaller Auto Coupon',
            'auto_apply' => true,
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 25,
        ]);

        $bestCoupon = $this->makeCoupon([
            'name' => 'Best Auto Coupon',
            'auto_apply' => true,
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'percentage',
            'discount_value' => 20,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.subtotal', '400.00')
            ->assertJsonPath('data.discount_amount', '80.00')
            ->assertJsonPath('data.total', '320.00');

        $order = Order::first();
        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $bestCoupon->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'discount_amount' => 80.00,
        ]);
        $this->assertDatabaseCount('coupon_redemptions', 1);
    }

    /** @test */
    public function coupon_discount_is_capped_to_the_discounted_cart_total_at_checkout()
    {
        Discount::create([
            'variant_id' => $this->variant->id,
            'type' => 'fixed',
            'value' => 190.00,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'is_active' => true,
        ]);

        $coupon = $this->makeCoupon([
            'name' => 'Large Fixed Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 200,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
            'coupon_code' => $coupon->customer_code,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.subtotal', '200.00')
            ->assertJsonPath('data.discount_amount', '200.00')
            ->assertJsonPath('data.total', '0.00');

        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $coupon->id,
            'subtotal' => 10.00,
            'discount_amount' => 10.00,
        ]);
    }

    /** @test */
    public function zero_discount_coupons_still_record_redemption_history()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Free Shipping Style Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 0,
            'free_shipping' => true,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'shipping_address' => [
                'street' => '123 Market Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
                'country' => 'USA',
            ],
            'coupon_code' => $coupon->customer_code,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.discount_amount', '0.00')
            ->assertJsonPath('data.total', '200.00');

        $this->assertDatabaseHas('coupon_redemptions', [
            'coupon_id' => $coupon->id,
            'user_id' => $this->customer->id,
            'discount_amount' => 0.00,
        ]);
    }

    /** @test */
    public function checkout_with_coupon_requires_shipping_address_for_market_resolution()
    {
        $coupon = $this->makeCoupon([
            'name' => 'Address Required Coupon',
        ], [
            'market' => 'INT',
            'currency' => 'USD',
            'discount_type' => 'fixed',
            'discount_value' => 10,
        ]);

        $cart = Cart::create(['user_id' => $this->customer->id]);
        $cart->items()->create([
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'address_id' => 'saved-address-1',
            'coupon_code' => $coupon->customer_code,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['shipping_address']);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('coupon_redemptions', 0);
    }

    private function makeCoupon(array $couponOverrides = [], array $ruleOverrides = [], array $restrictionOverrides = [], array $customerIds = []): Coupon
    {
        $coupon = Coupon::create(array_merge([
            'name' => 'Default Coupon',
            'customer_code' => null,
            'description' => 'Test coupon',
            'status' => 'active',
            'promotion_type' => 'standard',
            'auto_apply' => false,
            'starts_at' => now()->subDay(),
            'expires_at' => now()->addDay(),
            'usage_limit' => null,
            'usage_per_user' => null,
            'stackable' => false,
            'first_order_only' => false,
            'customer_type' => null,
            'payment_methods' => null,
            'bogo_config' => null,
            'tier_config' => null,
            'created_by' => $this->admin->id,
        ], $couponOverrides));

        if (!empty($ruleOverrides)) {
            $coupon->regionRules()->create(array_merge([
                'market' => 'INT',
                'currency' => 'USD',
                'customer_type' => null,
                'discount_type' => 'percentage',
                'discount_value' => 10,
                'minimum_subtotal' => 0,
                'maximum_discount' => null,
                'free_shipping' => false,
            ], $ruleOverrides));
        }

        if (!empty($restrictionOverrides['product_ids'] ?? [])) {
            $coupon->products()->sync($restrictionOverrides['product_ids']);
        }

        if (!empty($restrictionOverrides['category_ids'] ?? [])) {
            $coupon->categories()->sync($restrictionOverrides['category_ids']);
        }

        if (!empty($restrictionOverrides['brand_ids'] ?? [])) {
            $coupon->brands()->sync($restrictionOverrides['brand_ids']);
        }

        if (!empty($customerIds)) {
            $coupon->users()->sync($customerIds);
        }

        return $coupon->fresh(['regionRules', 'products', 'categories', 'brands', 'users']);
    }

    private function addCouponRule(Coupon $coupon, array $ruleOverrides = []): void
    {
        $coupon->regionRules()->create(array_merge([
            'market' => 'INT',
            'currency' => 'USD',
            'customer_type' => null,
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'minimum_subtotal' => 0,
            'maximum_discount' => null,
            'free_shipping' => false,
        ], $ruleOverrides));
    }

    private function couponItems(): array
    {
        return [[
            'product_id' => $this->product->id,
            'brand_id' => $this->brand->id,
            'category_ids' => [$this->category->id],
            'quantity' => 1,
            'unit_price' => 200,
            'line_total' => 200,
        ]];
    }

    private function createOrderFor(User $user): Order
    {
        return Order::create([
            'user_id' => $user->id,
            'order_number' => 'ORD-' . uniqid(),
            'user_type' => 'retail',
            'subtotal' => 500,
            'discount_amount' => 0,
            'total' => 500,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'shipping_address' => [
                'street' => '1 Main',
                'city' => 'Kathmandu',
                'state' => 'Bagmati',
                'zip' => '44600',
                'country' => 'Nepal',
            ],
        ]);
    }
}
