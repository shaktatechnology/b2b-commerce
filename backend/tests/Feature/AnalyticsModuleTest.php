<?php

namespace Tests\Feature;

use App\Models\DailySalesReport;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AnalyticsModuleTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    #[Test]
    public function admin_can_access_dashboard_statistics()
    {
        Carbon::setTestNow(Carbon::parse('2026-06-23 10:30:00'));

        $admin = $this->user('admin@example.com', 'admin');
        $customer = $this->user('customer@example.com', 'customer');

        [$fastProduct, $fastVariant] = $this->productWithVariant('Fast Seller', 'fast-seller', 'FAST-1', 25);
        [$lowProduct, $lowVariant] = $this->productWithVariant('Low Stock Item', 'low-stock-item', 'LOW-1', 4);

        $todayOrder = $this->order($customer, [
            'order_number' => 'ORD-20260623-AAA',
            'total' => 120,
            'status' => 'delivered',
            'payment_status' => 'paid',
        ]);
        $todayOrder->items()->create([
            'variant_id' => $fastVariant->id,
            'quantity' => 2,
            'unit_price' => 60,
            'line_total' => 120,
        ]);
        Payment::create([
            'order_id' => $todayOrder->id,
            'gateway' => 'esewa',
            'amount' => 120,
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $monthlyOrder = $this->order($customer, [
            'order_number' => 'ORD-20260601-BBB',
            'total' => 180,
            'status' => 'processing',
            'payment_status' => 'paid',
            'created_at' => now()->copy()->startOfMonth()->addDay(),
        ]);
        $monthlyOrder->items()->create([
            'variant_id' => $lowVariant->id,
            'quantity' => 5,
            'unit_price' => 36,
            'line_total' => 180,
        ]);
        Payment::create([
            'order_id' => $monthlyOrder->id,
            'gateway' => 'paypal',
            'amount' => 180,
            'status' => 'completed',
            'paid_at' => now()->copy()->startOfMonth()->addDay(),
        ]);

        $pendingOrder = $this->order($customer, [
            'order_number' => 'ORD-20260623-CCC',
            'total' => 75,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);
        $pendingOrder->items()->create([
            'variant_id' => $fastVariant->id,
            'quantity' => 1,
            'unit_price' => 75,
            'line_total' => 75,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/dashboard/statistics')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'total_revenue',
                    'todays_revenue',
                    'monthly_revenue',
                    'total_orders',
                    'pending_orders',
                    'completed_orders',
                    'total_customers',
                    'top_selling_products',
                    'low_stock_products',
                ],
            ]);

        $data = $response->json('data');

        $this->assertEquals(300.0, $data['total_revenue']);
        $this->assertEquals(120.0, $data['todays_revenue']);
        $this->assertEquals(300.0, $data['monthly_revenue']);
        $this->assertSame(3, $data['total_orders']);
        $this->assertSame(1, $data['pending_orders']);
        $this->assertSame(1, $data['completed_orders']);
        $this->assertSame(1, $data['total_customers']);
        $this->assertSame($lowProduct->id, $data['top_selling_products'][0]['product_id']);
        $this->assertSame($fastProduct->id, $data['top_selling_products'][1]['product_id']);
        $this->assertSame($lowVariant->id, $data['low_stock_products'][0]['variant_id']);
    }

    #[Test]
    public function non_admin_cannot_access_dashboard_statistics()
    {
        $customer = $this->user('customer@example.com', 'customer');

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/admin/dashboard/statistics')
            ->assertForbidden();
    }

    #[Test]
    public function daily_sales_report_command_updates_previous_day_statistics()
    {
        Carbon::setTestNow(Carbon::parse('2026-06-23 10:30:00'));

        $customer = $this->user('customer@example.com', 'customer');
        $customer->forceFill([
            'created_at' => Carbon::parse('2026-06-22 09:00:00'),
            'updated_at' => Carbon::parse('2026-06-22 09:00:00'),
        ])->save();

        [, $variant] = $this->productWithVariant('Daily Product', 'daily-product', 'DAILY-1', 30);

        $order = $this->order($customer, [
            'order_number' => 'ORD-20260622-AAA',
            'total' => 150,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'created_at' => Carbon::parse('2026-06-22 10:00:00'),
        ]);
        $order->items()->create([
            'variant_id' => $variant->id,
            'quantity' => 3,
            'unit_price' => 50,
            'line_total' => 150,
        ]);
        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => 'esewa',
            'amount' => 150,
            'status' => 'completed',
            'paid_at' => Carbon::parse('2026-06-22 10:15:00'),
        ]);

        $this->artisan('analytics:generate-daily-sales-report')->assertSuccessful();

        $report = DailySalesReport::whereDate('report_date', '2026-06-22')->firstOrFail();

        $this->assertEquals(150.0, (float) $report->revenue);
        $this->assertSame(1, $report->order_count);
        $this->assertSame(3, $report->items_sold);
        $this->assertSame(1, $report->new_customer_count);

        $payment->update(['amount' => 175]);

        $this->artisan('analytics:generate-daily-sales-report')->assertSuccessful();

        $report->refresh();

        $this->assertEquals(175.0, (float) $report->revenue);
        $this->assertSame(1, DailySalesReport::count());
    }

    private function user(string $email, string $role): User
    {
        return User::create([
            'name' => ucfirst($role),
            'email' => $email,
            'password' => bcrypt('password123'),
            'role' => $role,
        ]);
    }

    private function productWithVariant(string $name, string $slug, string $sku, int $stock): array
    {
        $product = Product::create([
            'name' => $name,
            'slug' => $slug,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'variant_name' => $name,
            'sku' => $sku,
            'retail_price' => 50,
            'wholesale_price' => 40,
            'stock' => $stock,
            'is_active' => true,
        ]);

        return [$product, $variant];
    }

    private function order(User $user, array $attributes): Order
    {
        $order = Order::create([
            'user_id' => $user->id,
            'order_number' => $attributes['order_number'],
            'user_type' => 'retail',
            'subtotal' => $attributes['total'],
            'discount_amount' => 0,
            'total' => $attributes['total'],
            'status' => $attributes['status'],
            'payment_status' => $attributes['payment_status'],
            'shipping_address' => ['street' => 'Test Street'],
        ]);

        if (isset($attributes['created_at'])) {
            $order->forceFill([
                'created_at' => $attributes['created_at'],
                'updated_at' => $attributes['created_at'],
            ])->save();
        }

        return $order;
    }
}
