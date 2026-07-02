'use client';

import * as React from 'react';
import { StatsCard } from '@/src/components/admin-components/stats-card';
import { 
  Users, 
  Briefcase, 
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  Bell,
  Megaphone,
  Zap,
  Globe,
  DollarSign,
  Clock,
  TrendingUp,
  Package,
  AlertTriangle,
  Timer,
  CreditCard,
  Tag,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { fetchDashboardStatistics } from '@/src/lib/dashboard-api';
import type { DashboardStatistics, TopSellingProduct, LowStockProduct } from '@/src/types/dashboard';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { Button } from '@/src/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/src/components/ui/card';
import Link from 'next/link';

function formatCurrency(amount: number | undefined | null): string {
  const val = Number(amount) || 0;
  if (val >= 1_000_000) return `Rs ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `Rs ${(val / 1_000).toFixed(1)}K`;
  return `Rs ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(num: number | undefined | null): string {
  const val = Number(num) || 0;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString();
}

function formatCountdown(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return 'Expired';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

// Skeleton loader for stat cards
function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-none shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-3 w-24 bg-zinc-200 rounded-full animate-pulse" />
                <div className="h-8 w-20 bg-zinc-200 rounded-lg animate-pulse" />
              </div>
              <div className="h-12 w-12 rounded-2xl bg-zinc-200 animate-pulse" />
            </div>
            <div className="mt-6 flex items-center gap-2">
              <div className="h-5 w-14 bg-zinc-100 rounded-full animate-pulse" />
              <div className="h-3 w-20 bg-zinc-100 rounded-full animate-pulse" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Table skeleton for product lists
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-zinc-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-zinc-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-zinc-200 rounded-full animate-pulse" />
              <div className="h-3 w-20 bg-zinc-100 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-16 bg-zinc-200 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function DashboardOverview() {
  const [stats, setStats] = React.useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Countdown timer for discount
  const [countdown, setCountdown] = React.useState<number | null>(null);

  const loadStats = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetchDashboardStatistics();
      setStats(res.data);

      // Initialize countdown from the response
      if (res.data.discount_time_left?.seconds_remaining != null) {
        setCountdown(res.data.discount_time_left.seconds_remaining);
      } else {
        setCountdown(null);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Countdown timer effect
  React.useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Error state
  if (error && !stats) {
    return (
      <div className="space-y-8" style={{ fontFamily: 'Lato, sans-serif' }}>
        <PageHeader 
          title="Admin Dashboard" 
          description="Welcome to Exclusive. Here's your platform overview today."
        />
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 text-red-500 mb-4">
              <AlertTriangle className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Failed to load dashboard</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">{error}</p>
            <Button 
              onClick={() => loadStats()} 
              className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white rounded-xl h-11 px-6"
            >
              <RefreshCw className="size-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'Lato, sans-serif' }}>
      <PageHeader 
        title="Admin Dashboard" 
        description="Welcome to Exclusive. Here's your platform overview today."
      >
        <Button 
          onClick={() => loadStats(true)} 
          disabled={refreshing}
          className="h-11 px-6 rounded-xl bg-[#966FD6] hover:bg-[#7d5bbf] text-white transition-all shadow-md"
        >
          <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </PageHeader>

      {/* ═══════════════════════ REVENUE SECTION ═══════════════════════ */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <DollarSign className="size-5 text-emerald-600" />
            Revenue Overview
          </h2>
          {loading ? (
            <StatsSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Revenue"
                value={formatCurrency(stats!.total_revenue)}
                description="All-time gross revenue"
                icon={DollarSign}
                trend="up"
                trendValue="Lifetime"
                href="/admin/payments"
              />
              <StatsCard
                title="Monthly Revenue"
                value={formatCurrency(stats!.monthly_revenue)}
                description="This month's earnings"
                icon={TrendingUp}
                trend="up"
                trendValue="This month"
                href="/admin/payments"
              />
              <StatsCard
                title="Today's Revenue"
                value={formatCurrency(stats!.todays_revenue)}
                description="Earned today so far"
                icon={Zap}
                trend={stats!.todays_revenue > 0 ? 'up' : undefined}
                trendValue={stats!.todays_revenue > 0 ? 'Active' : undefined}
                href="/admin/payments"
              />
              <StatsCard
                title="Pending Collections"
                value={formatCurrency(stats!.pending_collections)}
                description="Awaiting settlement"
                icon={Clock}
                trend={stats!.pending_collections > 0 ? 'down' : undefined}
                trendValue={stats!.pending_collections > 0 ? 'Unsettled' : undefined}
                href="/admin/payments"
              />
            </div>
          )}
        </div>

        {/* ═══════════════════════ ORDERS SECTION ═══════════════════════ */}
        <div>
          <h2 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <ShoppingCart className="size-5 text-[#966FD6]" />
            Orders Overview
          </h2>
          {loading ? (
            <StatsSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Orders"
                value={formatNumber(stats!.total_orders)}
                description="All-time orders placed"
                icon={ShoppingCart}
                trend="up"
                trendValue="Lifetime"
                href="/admin/orders"
              />
              <StatsCard
                title="Pending Orders"
                value={formatNumber(stats!.pending_orders)}
                description="Requires attention"
                icon={Clock}
                trend={stats!.pending_orders > 0 ? 'down' : 'up'}
                trendValue={stats!.pending_orders > 0 ? `${stats!.pending_orders} waiting` : 'All clear'}
                href="/admin/orders"
              />
              <StatsCard
                title="Paid Orders"
                value={formatNumber(stats!.paid_orders)}
                description="Payment received"
                icon={CreditCard}
                trend="up"
                trendValue="Confirmed"
                href="/admin/orders"
              />
              <StatsCard
                title="Completed"
                value={formatNumber(stats!.completed_orders)}
                description="Successfully fulfilled"
                icon={CheckCircle2}
                trend="up"
                trendValue="Delivered"
                href="/admin/orders"
              />
            </div>
          )}
        </div>

        {/* ═══════════════════════ SETTLEMENTS & CUSTOMERS ═══════════════════════ */}
        <div>
          <h2 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <Briefcase className="size-5 text-green-600" />
            Settlements & Customers
          </h2>
          {loading ? (
            <StatsSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Settled Today"
                value={`${stats!.settled_today}`}
                description={`Worth ${formatCurrency(stats!.settled_today_amount)}`}
                icon={CheckCircle2}
                trend={stats!.settled_today > 0 ? 'up' : undefined}
                trendValue={stats!.settled_today > 0 ? 'Today' : undefined}
                href="/admin/payments"
              />
              <StatsCard
                title="Settled Amount"
                value={formatCurrency(stats!.settled_today_amount)}
                description="Today's settled value"
                icon={DollarSign}
                trend={stats!.settled_today_amount > 0 ? 'up' : undefined}
                trendValue={stats!.settled_today_amount > 0 ? 'Cleared' : undefined}
                href="/admin/payments"
              />
              <StatsCard
                title="Total Customers"
                value={formatNumber(stats!.total_customers)}
                description="Registered users"
                icon={Users}
                trend="up"
                trendValue="All time"
                href="/admin/users"
              />
              <StatsCard
                title="Currency Split"
                value={`${stats!.npr_count} / ${stats!.usd_count}`}
                description="NPR orders / USD orders"
                icon={Globe}
              />
            </div>
          )}
        </div>

        {/* ═══════════════════════ DISCOUNTS SECTION ═══════════════════════ */}
        <div>
          <h2 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <Megaphone className="size-5 text-[#966FD6]" />
            Discounts & Promotions
          </h2>
          {loading ? (
            <StatsSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Active Discounts"
                value={`${stats!.active_discounts}`}
                description="Currently running"
                icon={Tag}
                trend={stats!.active_discounts > 0 ? 'up' : undefined}
                trendValue={stats!.active_discounts > 0 ? 'Live' : undefined}
                href="/admin/products"
              />
              <StatsCard
                title="Total Discount Given"
                value={formatCurrency(stats!.total_discount_amount)}
                description="Cumulative discount value"
                icon={DollarSign}
                href="/admin/products"
              />
              {stats!.discount_time_left ? (
                <StatsCard
                  title="Next Expiry"
                  value={formatCountdown(countdown)}
                  description={`Discount #${stats!.discount_time_left.discount_id}`}
                  icon={Timer}
                  trend={countdown !== null && countdown > 0 ? 'down' : undefined}
                  trendValue={countdown !== null && countdown > 0 ? 'Counting down' : 'Expired'}
                />
              ) : (
                <StatsCard
                  title="Next Expiry"
                  value="—"
                  description="No active timed discounts"
                  icon={Timer}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════ BOTTOM SECTION: PRODUCTS ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-2xl ring-1 ring-zinc-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-50 px-6 py-5">
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-black flex items-center gap-2">
                <TrendingUp className="size-5 text-[#966FD6]" />
                Top Selling Products
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1">Best performers by units sold</CardDescription>
            </div>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm" className="gap-1 text-[#966FD6] hover:bg-[#966FD6]/10 font-bold">
                View All <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton />
            ) : stats!.top_selling_products.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="size-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 font-medium">No sales data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {stats!.top_selling_products.map((product: TopSellingProduct, i: number) => (
                  <div key={product.id ? `${product.id}-${i}` : `top-selling-${i}`} className="flex items-center justify-between p-5 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#966FD6]/20 to-[#966FD6]/5 flex items-center justify-center text-[#966FD6] font-black text-sm border border-[#966FD6]/10">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-black/90 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-zinc-400 font-medium mt-0.5">
                          {product.total_sold} unit{product.total_sold !== 1 ? 's' : ''} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-black">{formatCurrency(product.total_revenue)}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-2xl ring-1 ring-zinc-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-50 px-6 py-5">
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-black flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                Low Stock Alert
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1">Products needing restock</CardDescription>
            </div>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm" className="gap-1 text-amber-600 hover:bg-amber-50 font-bold">
                Manage <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton />
            ) : stats!.low_stock_products.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="size-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 font-medium">All products well-stocked</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {stats!.low_stock_products.map((product: LowStockProduct, i: number) => (
                  <div key={product.id ? `${product.id}-${product.sku || product.variant_name || ''}-${i}` : `low-stock-${i}`} className="flex items-center justify-between p-5 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm border ${
                        product.stock === 0 
                          ? 'bg-red-50 text-red-600 border-red-100' 
                          : product.stock <= 5 
                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                            : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                      }`}>
                        {product.stock}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-black/90 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-zinc-400 font-medium mt-0.5">
                          {product.variant_name && <span>{product.variant_name} · </span>}
                          {product.sku && <span>SKU: {product.sku}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        product.stock === 0 
                          ? 'bg-red-50 text-red-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {product.stock === 0 ? (
                          <>
                            <AlertTriangle className="size-3" />
                            Out of Stock
                          </>
                        ) : (
                          <>
                            <Bell className="size-3" />
                            Low Stock
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════ QUICK ACTIONS CARD ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-2xl ring-1 ring-zinc-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-50 px-6 py-5">
            <CardTitle className="text-xl font-black tracking-tight text-black">Platform Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-zinc-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Revenue', value: formatCurrency(stats!.total_revenue), color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Monthly Revenue', value: formatCurrency(stats!.monthly_revenue), color: 'bg-blue-50 text-blue-700' },
                  { label: "Today's Revenue", value: formatCurrency(stats!.todays_revenue), color: 'bg-purple-50 text-purple-700' },
                  { label: 'Total Orders', value: formatNumber(stats!.total_orders), color: 'bg-orange-50 text-orange-700' },
                  { label: 'Pending Orders', value: formatNumber(stats!.pending_orders), color: 'bg-red-50 text-red-700' },
                  { label: 'Total Customers', value: formatNumber(stats!.total_customers), color: 'bg-indigo-50 text-indigo-700' },
                  { label: 'NPR Orders', value: formatNumber(stats!.npr_count), color: 'bg-teal-50 text-teal-700' },
                  { label: 'USD Orders', value: formatNumber(stats!.usd_count), color: 'bg-cyan-50 text-cyan-700' },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between rounded-xl px-5 py-3.5 ${item.color}`}>
                    <span className="text-sm font-semibold opacity-80">{item.label}</span>
                    <span className="font-black text-base">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_20px_40px_rgba(150,111,214,0.2)] bg-[#966FD6] text-white overflow-hidden relative rounded-2xl p-2 flex flex-col justify-center">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-black/10 rounded-full blur-2xl opacity-30" />
          <CardHeader className="relative z-10 pt-8">
            <CardTitle className="text-3xl font-black tracking-tighter">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10 pb-8">
            <p className="text-white/80 leading-relaxed font-medium">
              Manage your platform, orders, and products from here.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/admin/orders" className="flex items-center justify-between bg-white text-[#966FD6] hover:bg-zinc-100 font-black h-13 px-6 rounded-xl transition-all shadow-xl hover:translate-y-[-2px]">
                <span>View Orders</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/admin/products" className="flex items-center justify-between bg-black/20 text-white hover:bg-black/30 font-bold h-13 px-6 rounded-xl border-0 shadow-none transition-all">
                <span>Manage Products</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/admin/payments" className="flex items-center justify-between bg-black/20 text-white hover:bg-black/30 font-bold h-13 px-6 rounded-xl border-0 shadow-none transition-all">
                <span>Payments</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
