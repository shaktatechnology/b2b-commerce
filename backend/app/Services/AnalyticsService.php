<?php

namespace App\Services;

use App\Models\DailySalesReport;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    private const CUSTOMER_ROLES = ['customer', 'wholesaler', 'retailer'];

    public function dashboardStatistics(): array
    {
        $now = now();
        $customerRoleCounts = $this->customerRoleCounts();

        return [
            'total_revenue' => $this->revenue(),
            'todays_revenue' => $this->revenue($now->copy()->startOfDay(), $now->copy()->endOfDay()),
            'monthly_revenue' => $this->revenue($now->copy()->startOfMonth(), $now->copy()->endOfMonth()),
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'completed_orders' => Order::where('status', 'delivered')->count(),
            'total_customers' => array_sum($customerRoleCounts),
            'customer_role_counts' => $customerRoleCounts,
            'top_selling_products' => $this->topSellingProducts(),
            'low_stock_products' => $this->lowStockProducts(),
        ];
    }

    public function saveDailySalesReport(CarbonInterface|string $date): DailySalesReport
    {
        $data = $this->dailySalesReportData($date);
        $report = DailySalesReport::whereDate('report_date', $data['report_date'])->first();

        if ($report) {
            $report->fill($data)->save();

            return $report;
        }

        return DailySalesReport::create($data);
    }

    public function dailySalesReportData(CarbonInterface|string $date): array
    {
        $date = $this->asDate($date);
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();
        $saleOrderIds = $this->saleOrderIdsBetween($start, $end);

        return [
            'report_date' => $date->toDateString(),
            'revenue' => $this->revenue($start, $end),
            'order_count' => count($saleOrderIds),
            'items_sold' => $this->itemsSoldForOrders($saleOrderIds),
            'new_customer_count' => User::whereIn('role', self::CUSTOMER_ROLES)
                ->whereBetween('created_at', [$start, $end])
                ->count(),
        ];
    }

    public function topSellingProducts(int $limit = 5): array
    {
        return OrderItem::query()
            ->select([
                'products.id as product_id',
                'products.name',
                'products.slug',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.line_total) as revenue'),
            ])
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('product_variants', 'product_variants.id', '=', 'order_items.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('orders.payment_status', 'paid')
            ->where('orders.status', '!=', 'cancelled')
            ->groupBy('products.id', 'products.name', 'products.slug')
            ->orderByRaw('SUM(order_items.quantity) DESC')
            ->limit($limit)
            ->get()
            ->map(fn ($product) => [
                'product_id' => $product->product_id,
                'name' => $product->name,
                'slug' => $product->slug,
                'quantity_sold' => (int) $product->quantity_sold,
                'revenue' => $this->money($product->revenue),
            ])
            ->values()
            ->all();
    }

    public function lowStockProducts(int $threshold = 10, int $limit = 10): array
    {
        return ProductVariant::with('product:id,name,slug')
            ->where('stock', '<=', $threshold)
            ->orderBy('stock')
            ->limit($limit)
            ->get()
            ->map(fn (ProductVariant $variant) => [
                'product_id' => $variant->product_id,
                'product_name' => $variant->product?->name,
                'product_slug' => $variant->product?->slug,
                'variant_id' => $variant->id,
                'variant_name' => $variant->variant_name,
                'sku' => $variant->sku,
                'stock' => (int) $variant->stock,
            ])
            ->values()
            ->all();
    }

    private function revenue(?CarbonInterface $start = null, ?CarbonInterface $end = null): float
    {
        $completedPaymentsRevenue = $this->completedPaymentsQuery($start, $end)->sum('amount');
        $paidOrdersWithoutCompletedPaymentsRevenue = $this->paidOrdersWithoutCompletedPaymentsQuery($start, $end)->sum('total');

        return $this->money((float) $completedPaymentsRevenue + (float) $paidOrdersWithoutCompletedPaymentsRevenue);
    }

    private function customerRoleCounts(): array
    {
        $counts = User::query()
            ->select('role', DB::raw('COUNT(*) as total'))
            ->whereIn('role', self::CUSTOMER_ROLES)
            ->groupBy('role')
            ->pluck('total', 'role')
            ->all();

        return collect(self::CUSTOMER_ROLES)
            ->mapWithKeys(fn (string $role) => [$role => (int) ($counts[$role] ?? 0)])
            ->all();
    }

    private function saleOrderIdsBetween(CarbonInterface $start, CarbonInterface $end): array
    {
        $completedPaymentOrderIds = $this->completedPaymentsQuery($start, $end)
            ->distinct()
            ->pluck('order_id');

        $paidOrderIds = $this->paidOrdersWithoutCompletedPaymentsQuery($start, $end)
            ->pluck('id');

        return $completedPaymentOrderIds
            ->merge($paidOrderIds)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function itemsSoldForOrders(array $orderIds): int
    {
        if ($orderIds === []) {
            return 0;
        }

        return (int) OrderItem::whereIn('order_id', $orderIds)->sum('quantity');
    }

    private function completedPaymentsQuery(?CarbonInterface $start = null, ?CarbonInterface $end = null): Builder
    {
        $query = Payment::query()->where('status', 'completed');

        if ($start && $end) {
            $query->where(function (Builder $query) use ($start, $end) {
                $query->whereBetween('paid_at', [$start, $end])
                    ->orWhere(function (Builder $query) use ($start, $end) {
                        $query->whereNull('paid_at')
                            ->whereBetween('created_at', [$start, $end]);
                    });
            });
        }

        return $query;
    }

    private function paidOrdersWithoutCompletedPaymentsQuery(?CarbonInterface $start = null, ?CarbonInterface $end = null): Builder
    {
        $query = Order::query()
            ->where('payment_status', 'paid')
            ->whereDoesntHave('payments', fn (Builder $query) => $query->where('status', 'completed'));

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        return $query;
    }

    private function asDate(CarbonInterface|string $date): Carbon
    {
        return $date instanceof CarbonInterface
            ? Carbon::instance($date)->startOfDay()
            : Carbon::parse($date)->startOfDay();
    }

    private function money(mixed $value): float
    {
        return round((float) $value, 2);
    }
}
