'use client';

import * as React from 'react';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TableIcon,
  Hash,
  Download,
  Printer,
  FilterX,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Loader2,
  Calendar,
  AlertTriangle,
  Users,
  Activity,
  Package,
  UserCheck,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
} from 'lucide-react';
import { fetchAllPaymentsAdmin } from '@/src/lib/payments-api';
import { fetchDashboardStatistics } from '@/src/lib/dashboard-api';
import { fetchAllOrdersAdmin } from '@/src/lib/orders-api';
import type { Payment } from '@/src/types/payments';
import type { Order } from '@/src/types/orders';
import type { DashboardStatistics } from '@/src/types/dashboard';
import * as XLSX from 'xlsx';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'line' | 'bar' | 'pie' | 'numbers';
type PaymentMethodFilter = 'all' | 'cod' | 'paypal';
type AnalyticsCategory = 'revenue' | 'users' | 'orders';

interface MonthlyData {
  month: string;        // "Jan", "Feb", etc.
  monthIndex: number;   // 0-11
  revenue: number;
  orders: number;
  cod_revenue: number;
  paypal_revenue: number;
  cod_orders: number;
  paypal_orders: number;
  other_revenue: number;
  other_orders: number;
}

interface AggregatedStats {
  totalRevenue: number;
  totalOrders: number;
  codRevenue: number;
  paypalRevenue: number;
  codOrders: number;
  paypalOrders: number;
  otherRevenue: number;
  otherOrders: number;
  avgOrderValue: number;
  monthlyData: MonthlyData[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_COLORS = {
  primary: '#966FD6',
  secondary: '#6366F1',
  cod: '#10B981',
  paypal: '#3B82F6',
  other: '#F59E0B',
  accent: '#EC4899',
  muted: '#94A3B8',
};
const PIE_COLORS = ['#966FD6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6', '#EF4444', '#84CC16', '#06B6D4'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `Rs ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rs ${(amount / 1_000).toFixed(1)}K`;
  return `Rs ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function normalizeMethod(method: string): 'cod' | 'paypal' | 'other' {
  const m = (method || '').toLowerCase().trim();
  if (m === 'cod' || m === 'cash_on_delivery' || m === 'cash on delivery') return 'cod';
  if (m === 'paypal' || m.includes('paypal')) return 'paypal';
  return 'other';
}

function aggregatePayments(payments: Payment[], year: number, methodFilter: PaymentMethodFilter): AggregatedStats {
  // Initialize monthly buckets
  const monthly: MonthlyData[] = MONTH_NAMES.map((name, i) => ({
    month: name,
    monthIndex: i,
    revenue: 0,
    orders: 0,
    cod_revenue: 0,
    paypal_revenue: 0,
    cod_orders: 0,
    paypal_orders: 0,
    other_revenue: 0,
    other_orders: 0,
  }));

  let totalRevenue = 0;
  let totalOrders = 0;
  let codRevenue = 0;
  let paypalRevenue = 0;
  let codOrders = 0;
  let paypalOrders = 0;
  let otherRevenue = 0;
  let otherOrders = 0;

  for (const p of payments) {
    const dt = new Date(p.created_at);
    if (dt.getFullYear() !== year) continue;

    const method = normalizeMethod(p.method);

    // Apply method filter
    if (methodFilter !== 'all' && method !== methodFilter) continue;

    const amount = Number(p.amount) || 0;
    const monthIdx = dt.getMonth();

    monthly[monthIdx].revenue += amount;
    monthly[monthIdx].orders += 1;
    totalRevenue += amount;
    totalOrders += 1;

    if (method === 'cod') {
      monthly[monthIdx].cod_revenue += amount;
      monthly[monthIdx].cod_orders += 1;
      codRevenue += amount;
      codOrders += 1;
    } else if (method === 'paypal') {
      monthly[monthIdx].paypal_revenue += amount;
      monthly[monthIdx].paypal_orders += 1;
      paypalRevenue += amount;
      paypalOrders += 1;
    } else {
      monthly[monthIdx].other_revenue += amount;
      monthly[monthIdx].other_orders += 1;
      otherRevenue += amount;
      otherOrders += 1;
    }
  }

  return {
    totalRevenue,
    totalOrders,
    codRevenue,
    paypalRevenue,
    codOrders,
    paypalOrders,
    otherRevenue,
    otherOrders,
    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    monthlyData: monthly,
  };
}

// ─── Excel Export ──────────────────────────────────────────────────────────────

function exportToExcel(data: MonthlyData[], stats: AggregatedStats, year: number, methodFilter: string) {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    ['Revenue Report', year.toString()],
    ['Payment Method', methodFilter === 'all' ? 'All Methods' : methodFilter.toUpperCase()],
    ['Generated', new Date().toLocaleString()],
    [],
    ['SUMMARY', ''],
    ['Metric', 'Value'],
    ['Total Revenue', stats.totalRevenue],
    ['Total Orders', stats.totalOrders],
    ['Average Order Value', stats.avgOrderValue],
    ['COD Revenue', stats.codRevenue],
    ['COD Orders', stats.codOrders],
    ['PayPal Revenue', stats.paypalRevenue],
    ['PayPal Orders', stats.paypalOrders],
  ];

  if (stats.otherRevenue > 0) {
    summaryData.push(['Other Revenue', stats.otherRevenue]);
    summaryData.push(['Other Orders', stats.otherOrders]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // 2. Monthly Data Sheet
  const monthlyData = [
    ['Month', 'Total Revenue', 'Total Orders', 'COD Revenue', 'COD Orders', 'PayPal Revenue', 'PayPal Orders', 'Other Revenue', 'Other Orders']
  ];

  data.forEach(m => {
    monthlyData.push([
      m.month,
      m.revenue as any,
      m.orders as any,
      m.cod_revenue as any,
      m.cod_orders as any,
      m.paypal_revenue as any,
      m.paypal_orders as any,
      m.other_revenue as any,
      m.other_orders as any,
    ]);
  });

  // Totals row
  monthlyData.push([
    'TOTAL',
    stats.totalRevenue as any,
    stats.totalOrders as any,
    stats.codRevenue as any,
    stats.codOrders as any,
    stats.paypalRevenue as any,
    stats.paypalOrders as any,
    stats.otherRevenue as any,
    stats.otherOrders as any,
  ]);

  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
  XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Breakdown');

  // Trigger download
  XLSX.writeFile(wb, `revenue_report_${year}_${methodFilter}.xlsx`);
}

// ─── Print ───────────────────────────────────────────────────────────────────

function printReport() {
  window.print();
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-100 px-5 py-4 min-w-[180px]">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-6 py-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-bold text-zinc-600">{entry.name}</span>
          </div>
          <span className="text-sm font-black text-zinc-900">
            {entry.name.toLowerCase().includes('order') ? entry.value : `Rs ${Number(entry.value).toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── View Mode Button ────────────────────────────────────────────────────────

function ViewModeButton({
  mode,
  currentMode,
  icon: Icon,
  label,
  onClick,
}: {
  mode: ViewMode;
  currentMode: ViewMode;
  icon: React.ElementType;
  label: string;
  onClick: (mode: ViewMode) => void;
}) {
  const isActive = mode === currentMode;
  return (
    <button
      onClick={() => onClick(mode)}
      className={`
        inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
        ${isActive
          ? 'bg-[#966FD6] text-white shadow-lg shadow-[#966FD6]/25 scale-[1.02]'
          : 'bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 border border-zinc-200'
        }
      `}
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Stat Number Card ────────────────────────────────────────────────────────

function StatNumberCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{title}</p>
          <p className="text-2xl font-black text-zinc-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              {trend === 'up' && <TrendingUp className="size-3 text-emerald-500" />}
              {trend === 'down' && <TrendingDown className="size-3 text-red-400" />}
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="size-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [dashboardStats, setDashboardStats] = React.useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [methodFilter, setMethodFilter] = React.useState<PaymentMethodFilter>('all');
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [analyticsCategory, setAnalyticsCategory] = React.useState<AnalyticsCategory>('revenue');
  const [allOrders, setAllOrders] = React.useState<Order[]>([]);

  // Available years from payment data
  const [availableYears, setAvailableYears] = React.useState<number[]>([currentYear]);

  const loadData = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Fetch all payments (no pagination, get everything for aggregation)
      // We'll fetch multiple pages to get all data
      let allPayments: Payment[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await fetchAllPaymentsAdmin({ page });
        let data: Payment[] = [];
        let lastPage = 1;

        if (Array.isArray(res)) {
          data = res;
          hasMore = false;
        } else {
          const resData = res?.data?.data || res?.data || [];
          data = Array.isArray(resData) ? resData : [];
          lastPage = res?.data?.last_page || res?.last_page || res?.meta?.last_page || 1;
          hasMore = page < lastPage;
        }

        allPayments = [...allPayments, ...data];
        page++;

        // Safety: max 50 pages
        if (page > 50) break;
      }

      setPayments(allPayments);

      // Generate available years from currentYear down to 2000
      const sortedYears = Array.from(
        { length: currentYear - 2000 + 1 },
        (_, i) => currentYear - i
      );
      setAvailableYears(sortedYears);

      // Also fetch all orders for order/user analytics
      try {
        let allOrdersFetched: Order[] = [];
        let oPage = 1;
        let oHasMore = true;
        while (oHasMore) {
          const oRes = await fetchAllOrdersAdmin({ page: oPage });
          allOrdersFetched = [...allOrdersFetched, ...oRes.orders];
          oHasMore = oPage < oRes.lastPage;
          oPage++;
          if (oPage > 50) break;
        }
        setAllOrders(allOrdersFetched);
      } catch {
        // Non-critical
      }

      // Also fetch dashboard stats for additional context
      try {
        const dashRes = await fetchDashboardStatistics();
        setDashboardStats(dashRes.data);
      } catch {
        // Non-critical — continue without dashboard stats
      }
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentYear]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute aggregated stats based on filters
  const aggregated = React.useMemo(
    () => aggregatePayments(payments, selectedYear, methodFilter),
    [payments, selectedYear, methodFilter]
  );

  // Compute order analytics
  const orderAnalytics = React.useMemo(() => {
    const yearOrders = allOrders.filter(o => {
      const d = new Date(o.created_at || '');
      return d.getFullYear() === selectedYear;
    });
    const statusCounts: Record<string, number> = {};
    const paymentStatusCounts: Record<string, number> = {};
    const monthlyOrders = MONTH_NAMES.map((name, i) => ({ month: name, monthIndex: i, orders: 0, revenue: 0 }));
    let totalRev = 0;

    yearOrders.forEach(o => {
      const s = o.status || 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      const ps = o.payment_status || 'unknown';
      paymentStatusCounts[ps] = (paymentStatusCounts[ps] || 0) + 1;
      const dt = new Date(o.created_at || '');
      const mi = dt.getMonth();
      monthlyOrders[mi].orders += 1;
      const amt = Number(o.total) || Number(o.total_amount) || 0;
      monthlyOrders[mi].revenue += amt;
      totalRev += amt;
    });

    return {
      total: yearOrders.length,
      totalRevenue: totalRev,
      avgOrderValue: yearOrders.length > 0 ? totalRev / yearOrders.length : 0,
      statusCounts,
      paymentStatusCounts,
      monthlyOrders,
      retailOrders: yearOrders.filter(o => o.user_type === 'retail').length,
      wholesaleOrders: yearOrders.filter(o => o.user_type === 'wholesale').length,
    };
  }, [allOrders, selectedYear]);

  // Compute user analytics
  const userAnalytics = React.useMemo(() => {
    const yearOrders = allOrders.filter(o => {
      const d = new Date(o.created_at || '');
      return d.getFullYear() === selectedYear;
    });
    const uniqueUsers = new Map<string, { name: string; email: string; type: string; orderCount: number; totalSpent: number; firstOrder: string }>();
    const monthlyNewUsers = MONTH_NAMES.map((name, i) => ({ month: name, monthIndex: i, newUsers: 0, activeUsers: 0 }));
    const seenByMonth = MONTH_NAMES.map(() => new Set<string>());

    yearOrders.forEach(o => {
      const uid = o.user_id || o.user?.id || '';
      if (!uid) return;
      const amt = Number(o.total) || Number(o.total_amount) || 0;
      const dt = new Date(o.created_at || '');
      const mi = dt.getMonth();
      seenByMonth[mi].add(uid);

      if (uniqueUsers.has(uid)) {
        const u = uniqueUsers.get(uid)!;
        u.orderCount += 1;
        u.totalSpent += amt;
        if (o.created_at && o.created_at < u.firstOrder) u.firstOrder = o.created_at;
      } else {
        uniqueUsers.set(uid, {
          name: o.user?.name || o.customer || 'Unknown',
          email: o.user?.email || '',
          type: o.user_type || 'retail',
          orderCount: 1,
          totalSpent: amt,
          firstOrder: o.created_at || '',
        });
      }
    });

    // Track new users per month (first appearance)
    const firstSeenMonth = new Map<string, number>();
    yearOrders.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()).forEach(o => {
      const uid = o.user_id || o.user?.id || '';
      if (!uid) return;
      if (!firstSeenMonth.has(uid)) {
        const mi = new Date(o.created_at || '').getMonth();
        firstSeenMonth.set(uid, mi);
        monthlyNewUsers[mi].newUsers += 1;
      }
    });
    seenByMonth.forEach((s, i) => { monthlyNewUsers[i].activeUsers = s.size; });

    const topCustomers = Array.from(uniqueUsers.values()).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
    const retailUsers = Array.from(uniqueUsers.values()).filter(u => u.type === 'retail').length;
    const wholesaleUsers = Array.from(uniqueUsers.values()).filter(u => u.type === 'wholesale').length;

    return {
      totalUniqueUsers: uniqueUsers.size,
      retailUsers,
      wholesaleUsers,
      avgOrdersPerUser: uniqueUsers.size > 0 ? yearOrders.length / uniqueUsers.size : 0,
      avgSpendPerUser: uniqueUsers.size > 0 ? Array.from(uniqueUsers.values()).reduce((s, u) => s + u.totalSpent, 0) / uniqueUsers.size : 0,
      monthlyNewUsers,
      topCustomers,
    };
  }, [allOrders, selectedYear]);

  const clearFilters = () => {
    setSelectedYear(currentYear);
    setMethodFilter('all');
  };

  const hasActiveFilters = selectedYear !== currentYear || methodFilter !== 'all';

  // ─── Error State ─────────────────────────────────────────────────────────
  if (error && payments.length === 0) {
    return (
      <div className="space-y-8 font-lato">
        <PageHeader
          title="Analytics & Reports"
          description="Revenue analytics, payment insights, and exportable reports."
        />
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 text-red-500 mb-4">
              <AlertTriangle className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Failed to load analytics</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">{error}</p>
            <Button
              onClick={() => loadData()}
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
    <div className="space-y-8 font-lato" id="analytics-report-area">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Analytics & Reports"
        description="Revenue analytics, payment insights, and exportable reports."
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => exportToExcel(aggregated.monthlyData, aggregated, selectedYear, methodFilter)}
            disabled={loading}
            className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md gap-2"
          >
            <Download className="size-4" />
            Export Excel
          </Button>
          <Button
            onClick={printReport}
            disabled={loading}
            variant="outline"
            className="h-11 px-5 rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-all gap-2 font-bold"
          >
            <Printer className="size-4" />
            Print
          </Button>
          <Button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-11 px-5 rounded-xl bg-[#966FD6] hover:bg-[#7d5bbf] text-white transition-all shadow-md"
          >
            <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </PageHeader>

      {/* ─── Analytics Category Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-zinc-100/80 p-1.5 rounded-2xl w-fit">
        {([
          { key: 'revenue' as AnalyticsCategory, icon: DollarSign, label: 'Revenue', color: '#10B981' },
          { key: 'users' as AnalyticsCategory, icon: Users, label: 'Users', color: '#966FD6' },
          { key: 'orders' as AnalyticsCategory, icon: Package, label: 'Orders', color: '#3B82F6' },
        ]).map(tab => {
          const isActive = analyticsCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setAnalyticsCategory(tab.key)}
              className={`
                inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-300
                ${isActive
                  ? 'bg-white text-zinc-900 shadow-lg shadow-black/5 scale-[1.02]'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50'
                }
              `}
            >
              <tab.icon className="size-4" style={isActive ? { color: tab.color } : {}} />
              {tab.label}
              {isActive && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: tab.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Filters & View Mode Toolbar ────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-zinc-400" />
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[120px] h-11 rounded-xl border-zinc-200 bg-white font-bold text-zinc-600 focus:ring-[#966FD6]/30">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="max-h-[350px]">
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {analyticsCategory === 'revenue' && (
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-zinc-400" />
              <Select value={methodFilter} onValueChange={(v: any) => setMethodFilter(v)}>
                <SelectTrigger className="w-[150px] h-11 rounded-xl border-zinc-200 bg-white font-bold text-zinc-600 focus:ring-[#966FD6]/30">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cod">COD Only</SelectItem>
                  <SelectItem value="paypal">PayPal Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-11 px-4 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold gap-2"
            >
              <FilterX className="size-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <ViewModeButton mode="table" currentMode={viewMode} icon={TableIcon} label="Table" onClick={setViewMode} />
          <ViewModeButton mode="line" currentMode={viewMode} icon={LineChartIcon} label="Line Chart" onClick={setViewMode} />
          <ViewModeButton mode="bar" currentMode={viewMode} icon={BarChart3} label="Bar Chart" onClick={setViewMode} />
          <ViewModeButton mode="pie" currentMode={viewMode} icon={PieChartIcon} label="Pie Chart" onClick={setViewMode} />
          <ViewModeButton mode="numbers" currentMode={viewMode} icon={Hash} label="Numbers" onClick={setViewMode} />
        </div>
      </div>

      {/* ═══════════════════ REVENUE CATEGORY ═══════════════════ */}
      {analyticsCategory === 'revenue' && (<>
      {/* ─── Summary Stats Strip ────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-6">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-20 mb-4" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatNumberCard
            title="Total Revenue"
            value={formatCurrency(aggregated.totalRevenue)}
            subtitle={`${selectedYear} • ${methodFilter === 'all' ? 'All methods' : methodFilter.toUpperCase()}`}
            icon={DollarSign}
            color="#10B981"
            trend="up"
          />
          <StatNumberCard
            title="Total Orders"
            value={formatNumber(aggregated.totalOrders)}
            subtitle={`Avg: ${formatCurrency(aggregated.avgOrderValue)}`}
            icon={ShoppingCart}
            color="#966FD6"
            trend="up"
          />
          <StatNumberCard
            title="COD Revenue"
            value={formatCurrency(aggregated.codRevenue)}
            subtitle={`${aggregated.codOrders} order${aggregated.codOrders !== 1 ? 's' : ''}`}
            icon={CreditCard}
            color={CHART_COLORS.cod}
          />
          <StatNumberCard
            title="PayPal Revenue"
            value={formatCurrency(aggregated.paypalRevenue)}
            subtitle={`${aggregated.paypalOrders} order${aggregated.paypalOrders !== 1 ? 's' : ''}`}
            icon={CreditCard}
            color={CHART_COLORS.paypal}
          />
        </div>
      )}

      {/* ─── Main Content Area ──────────────────────────────────────────────── */}
      {loading ? (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white print-area">
              <CardHeader className="border-b border-zinc-50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-black flex items-center gap-2">
                      <TableIcon className="size-5 text-[#966FD6]" />
                      Monthly Revenue Breakdown
                    </CardTitle>
                    <CardDescription className="text-zinc-400 mt-1">
                      {selectedYear} • {methodFilter === 'all' ? 'All payment methods' : `${methodFilter.toUpperCase()} only`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-zinc-50/30">
                        <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">Month</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#966FD6]">Revenue</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#966FD6]">Orders</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-emerald-600">COD</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-blue-600">PayPal</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-amber-600">Other</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-zinc-500">Avg / Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aggregated.monthlyData.map((m) => {
                        const avgOrder = m.orders > 0 ? m.revenue / m.orders : 0;
                        return (
                          <TableRow key={m.month} className="hover:bg-zinc-50/50 transition-colors">
                            <TableCell className="px-6 py-5 font-bold text-zinc-900">{m.month} {selectedYear}</TableCell>
                            <TableCell className="px-6 py-5 text-right font-black text-zinc-900">{formatCurrency(m.revenue)}</TableCell>
                            <TableCell className="px-6 py-5 text-right font-bold text-zinc-600">{m.orders}</TableCell>
                            <TableCell className="px-6 py-5 text-right">
                              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                                {formatCurrency(m.cod_revenue)}
                                <span className="text-[10px] text-emerald-500">{m.cod_orders > 0 ? `(${m.cod_orders})` : ''}</span>
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right">
                              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700">
                                {formatCurrency(m.paypal_revenue)}
                                <span className="text-[10px] text-blue-500">{m.paypal_orders > 0 ? `(${m.paypal_orders})` : ''}</span>
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right">
                              <span className="text-sm font-bold text-amber-700">
                                {m.other_revenue > 0 ? formatCurrency(m.other_revenue) : '–'}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right text-sm font-bold text-zinc-500">
                              {avgOrder > 0 ? formatCurrency(avgOrder) : '–'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Totals row */}
                      <TableRow className="bg-[#966FD6]/5 border-t-2 border-[#966FD6]/20">
                        <TableCell className="px-6 py-5 font-black text-[#966FD6] text-sm uppercase tracking-wider">Total</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-[#966FD6] text-base">{formatCurrency(aggregated.totalRevenue)}</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-[#966FD6]">{aggregated.totalOrders}</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-emerald-700">{formatCurrency(aggregated.codRevenue)}</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-blue-700">{formatCurrency(aggregated.paypalRevenue)}</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-amber-700">{aggregated.otherRevenue > 0 ? formatCurrency(aggregated.otherRevenue) : '–'}</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-zinc-500">{formatCurrency(aggregated.avgOrderValue)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LINE CHART VIEW */}
          {viewMode === 'line' && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-zinc-50 px-6 py-5">
                <CardTitle className="text-xl font-black text-black flex items-center gap-2">
                  <LineChartIcon className="size-5 text-[#966FD6]" />
                  Revenue Trend
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">
                  {selectedYear} monthly revenue trend {methodFilter !== 'all' ? `• ${methodFilter.toUpperCase()} only` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={aggregated.monthlyData}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                    {methodFilter === 'all' ? (
                      <>
                        <Line type="monotone" dataKey="revenue" name="Total Revenue" stroke={CHART_COLORS.primary} strokeWidth={3} dot={{ r: 5, fill: CHART_COLORS.primary }} activeDot={{ r: 7, fill: CHART_COLORS.primary }} />
                        <Line type="monotone" dataKey="cod_revenue" name="COD Revenue" stroke={CHART_COLORS.cod} strokeWidth={2} dot={{ r: 4, fill: CHART_COLORS.cod }} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="paypal_revenue" name="PayPal Revenue" stroke={CHART_COLORS.paypal} strokeWidth={2} dot={{ r: 4, fill: CHART_COLORS.paypal }} strokeDasharray="5 5" />
                      </>
                    ) : (
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke={methodFilter === 'cod' ? CHART_COLORS.cod : CHART_COLORS.paypal} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* BAR CHART VIEW */}
          {viewMode === 'bar' && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-zinc-50 px-6 py-5">
                <CardTitle className="text-xl font-black text-black flex items-center gap-2">
                  <BarChart3 className="size-5 text-[#966FD6]" />
                  Revenue by Month
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">
                  {selectedYear} monthly revenue comparison {methodFilter !== 'all' ? `• ${methodFilter.toUpperCase()} only` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregated.monthlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                    {methodFilter === 'all' ? (
                      <>
                        <Bar dataKey="cod_revenue" name="COD Revenue" fill={CHART_COLORS.cod} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="paypal_revenue" name="PayPal Revenue" fill={CHART_COLORS.paypal} radius={[4, 4, 0, 0]} />
                        {aggregated.otherRevenue > 0 && (
                          <Bar dataKey="other_revenue" name="Other Revenue" fill={CHART_COLORS.other} radius={[4, 4, 0, 0]} />
                        )}
                      </>
                    ) : (
                      <Bar dataKey="revenue" name="Revenue" fill={methodFilter === 'cod' ? CHART_COLORS.cod : CHART_COLORS.paypal} radius={[6, 6, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* PIE CHART VIEW */}
          {viewMode === 'pie' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Distribution Pie */}
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-zinc-50 px-6 py-5">
                  <CardTitle className="text-xl font-black text-black flex items-center gap-2">
                    <PieChartIcon className="size-5 text-[#966FD6]" />
                    Revenue by Payment Method
                  </CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">{selectedYear} breakdown</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'COD', value: aggregated.codRevenue },
                          { name: 'PayPal', value: aggregated.paypalRevenue },
                          ...(aggregated.otherRevenue > 0 ? [{ name: 'Other', value: aggregated.otherRevenue }] : []),
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={140}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      >
                        <Cell fill={CHART_COLORS.cod} />
                        <Cell fill={CHART_COLORS.paypal} />
                        {aggregated.otherRevenue > 0 && <Cell fill={CHART_COLORS.other} />}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`Rs ${(Number(value) || 0).toLocaleString()}`, 'Revenue']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 13, fontWeight: 700, paddingTop: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Revenue Distribution Pie */}
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-zinc-50 px-6 py-5">
                  <CardTitle className="text-xl font-black text-black flex items-center gap-2">
                    <PieChartIcon className="size-5 text-[#966FD6]" />
                    Revenue by Month
                  </CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">{selectedYear} monthly share</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregated.monthlyData.filter(m => m.revenue > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={140}
                        paddingAngle={2}
                        dataKey="revenue"
                        nameKey="month"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      >
                        {aggregated.monthlyData.filter(m => m.revenue > 0).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`Rs ${(Number(value) || 0).toLocaleString()}`, 'Revenue']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 13, fontWeight: 700, paddingTop: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* NUMBERS ONLY VIEW */}
          {viewMode === 'numbers' && (
            <div className="space-y-8">
              {/* Overview Numbers */}
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-zinc-50 px-6 py-5">
                  <CardTitle className="text-xl font-black text-black flex items-center gap-2">
                    <Hash className="size-5 text-[#966FD6]" />
                    Revenue Summary
                  </CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">
                    {selectedYear} • {methodFilter === 'all' ? 'All payment methods' : `${methodFilter.toUpperCase()} only`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Revenue', value: formatCurrency(aggregated.totalRevenue), color: 'bg-emerald-50 text-emerald-700' },
                      { label: 'Total Orders', value: formatNumber(aggregated.totalOrders), color: 'bg-purple-50 text-purple-700' },
                      { label: 'Avg Order Value', value: formatCurrency(aggregated.avgOrderValue), color: 'bg-blue-50 text-blue-700' },
                      { label: 'COD Revenue', value: formatCurrency(aggregated.codRevenue), color: 'bg-green-50 text-green-700' },
                      { label: 'COD Orders', value: formatNumber(aggregated.codOrders), color: 'bg-green-50 text-green-700' },
                      { label: 'PayPal Revenue', value: formatCurrency(aggregated.paypalRevenue), color: 'bg-sky-50 text-sky-700' },
                      { label: 'PayPal Orders', value: formatNumber(aggregated.paypalOrders), color: 'bg-sky-50 text-sky-700' },
                      ...(aggregated.otherRevenue > 0 ? [
                        { label: 'Other Revenue', value: formatCurrency(aggregated.otherRevenue), color: 'bg-amber-50 text-amber-700' },
                      ] : []),
                    ].map((item) => (
                      <div key={item.label} className={`flex items-center justify-between rounded-xl px-5 py-4 ${item.color}`}>
                        <span className="text-sm font-semibold opacity-80">{item.label}</span>
                        <span className="font-black text-base">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Dashboard stats (if available) */}
                  {dashboardStats && (
                    <div className="mt-8 pt-6 border-t border-zinc-100">
                      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Platform Overview (Live)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Lifetime Revenue', value: formatCurrency(dashboardStats.total_revenue), color: 'bg-violet-50 text-violet-700' },
                          { label: "Today's Revenue", value: formatCurrency(dashboardStats.todays_revenue), color: 'bg-indigo-50 text-indigo-700' },
                          { label: 'Monthly Revenue', value: formatCurrency(dashboardStats.monthly_revenue), color: 'bg-fuchsia-50 text-fuchsia-700' },
                          { label: 'Total Customers', value: formatNumber(dashboardStats.total_customers), color: 'bg-rose-50 text-rose-700' },
                          { label: 'Total Orders', value: formatNumber(dashboardStats.total_orders), color: 'bg-orange-50 text-orange-700' },
                          { label: 'Pending Orders', value: formatNumber(dashboardStats.pending_orders), color: 'bg-red-50 text-red-700' },
                          { label: 'Paid Orders', value: formatNumber(dashboardStats.paid_orders), color: 'bg-teal-50 text-teal-700' },
                          { label: 'Completed Orders', value: formatNumber(dashboardStats.completed_orders), color: 'bg-cyan-50 text-cyan-700' },
                        ].map((item) => (
                          <div key={item.label} className={`flex items-center justify-between rounded-xl px-5 py-4 ${item.color}`}>
                            <span className="text-sm font-semibold opacity-80">{item.label}</span>
                            <span className="font-black text-base">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Numbers Grid */}
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-zinc-50 px-6 py-5">
                  <CardTitle className="text-lg font-black text-black">Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {aggregated.monthlyData.map((m) => (
                      <div
                        key={m.month}
                        className={`rounded-2xl border p-5 transition-all duration-200 hover:shadow-md ${
                          m.revenue > 0 ? 'border-zinc-100 bg-white' : 'border-zinc-50 bg-zinc-50/50'
                        }`}
                      >
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">{m.month} {selectedYear}</p>
                        <p className="text-xl font-black text-zinc-900">{formatCurrency(m.revenue)}</p>
                        <p className="text-xs font-bold text-zinc-400 mt-1">{m.orders} order{m.orders !== 1 ? 's' : ''}</p>
                        {m.revenue > 0 && (
                          <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1">
                            {m.cod_revenue > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-emerald-600">COD</span>
                                <span className="font-bold text-emerald-700">{formatCurrency(m.cod_revenue)}</span>
                              </div>
                            )}
                            {m.paypal_revenue > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-blue-600">PayPal</span>
                                <span className="font-bold text-blue-700">{formatCurrency(m.paypal_revenue)}</span>
                              </div>
                            )}
                            {m.other_revenue > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-amber-600">Other</span>
                                <span className="font-bold text-amber-700">{formatCurrency(m.other_revenue)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      </>)}

      {/* ═══════════════════ USERS CATEGORY ═══════════════════ */}
      {analyticsCategory === 'users' && (<>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-6">
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-8 w-20 mb-4" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (<>
          {/* User Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatNumberCard title="Unique Customers" value={formatNumber(userAnalytics.totalUniqueUsers)} subtitle={`${selectedYear} active buyers`} icon={Users} color="#966FD6" trend="up" />
            <StatNumberCard title="Retail Users" value={formatNumber(userAnalytics.retailUsers)} subtitle={`${userAnalytics.totalUniqueUsers > 0 ? ((userAnalytics.retailUsers / userAnalytics.totalUniqueUsers) * 100).toFixed(0) : 0}% of total`} icon={UserCheck} color="#10B981" />
            <StatNumberCard title="Wholesale Users" value={formatNumber(userAnalytics.wholesaleUsers)} subtitle={`${userAnalytics.totalUniqueUsers > 0 ? ((userAnalytics.wholesaleUsers / userAnalytics.totalUniqueUsers) * 100).toFixed(0) : 0}% of total`} icon={UserPlus} color="#3B82F6" />
            <StatNumberCard title="Avg Orders/User" value={userAnalytics.avgOrdersPerUser.toFixed(1)} subtitle={`Avg spend: ${formatCurrency(userAnalytics.avgSpendPerUser)}`} icon={Activity} color="#F59E0B" />
          </div>

          {/* User Charts */}
          {(viewMode === 'line' || viewMode === 'bar') && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-zinc-50 px-6 py-5">
                <CardTitle className="text-xl font-black text-black flex items-center gap-2">
                  <Users className="size-5 text-[#966FD6]" />
                  Customer Activity Trend
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">{selectedYear} new & active customers by month</CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  {viewMode === 'line' ? (
                    <LineChart data={userAnalytics.monthlyNewUsers}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                      <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="#966FD6" strokeWidth={3} dot={{ r: 5, fill: '#966FD6' }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981' }} strokeDasharray="5 5" />
                    </LineChart>
                  ) : (
                    <BarChart data={userAnalytics.monthlyNewUsers} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                      <Bar dataKey="activeUsers" name="Active Users" fill="#966FD6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="newUsers" name="New Users" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {viewMode === 'pie' && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-zinc-50 px-6 py-5">
                <CardTitle className="text-xl font-black text-black flex items-center gap-2"><PieChartIcon className="size-5 text-[#966FD6]" /> User Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6 h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: 'Retail', value: userAnalytics.retailUsers }, { name: 'Wholesale', value: userAnalytics.wholesaleUsers }].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={70} outerRadius={140} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}>
                      <Cell fill="#10B981" />
                      <Cell fill="#3B82F6" />
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, 'Users']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: 13, fontWeight: 700, paddingTop: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(viewMode === 'table' || viewMode === 'numbers') && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-zinc-50 px-6 py-5">
                <CardTitle className="text-xl font-black text-black flex items-center gap-2"><Users className="size-5 text-[#966FD6]" /> Top Customers</CardTitle>
                <CardDescription className="text-zinc-400 mt-1">{selectedYear} • By total spend</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-zinc-50/30">
                        <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">#</TableHead>
                        <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">Customer</TableHead>
                        <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">Type</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#966FD6]">Orders</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#966FD6]">Total Spent</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#966FD6]">Avg Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userAnalytics.topCustomers.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-bold">No customer data for {selectedYear}</TableCell></TableRow>
                      ) : userAnalytics.topCustomers.map((c, i) => (
                        <TableRow key={i} className="hover:bg-zinc-50/50 transition-colors">
                          <TableCell className="px-6 py-5 font-black text-zinc-400">{i + 1}</TableCell>
                          <TableCell className="px-6 py-5"><span className="font-bold text-zinc-900">{c.name}</span>{c.email && <span className="block text-xs text-zinc-400">{c.email}</span>}</TableCell>
                          <TableCell className="px-6 py-5"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${c.type === 'wholesale' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{c.type}</span></TableCell>
                          <TableCell className="px-6 py-5 text-right font-bold text-zinc-600">{c.orderCount}</TableCell>
                          <TableCell className="px-6 py-5 text-right font-black text-zinc-900">{formatCurrency(c.totalSpent)}</TableCell>
                          <TableCell className="px-6 py-5 text-right font-bold text-zinc-500">{formatCurrency(c.orderCount > 0 ? c.totalSpent / c.orderCount : 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>)}
      </>)}

      {/* ═══════════════════ ORDERS CATEGORY ═══════════════════ */}
      {analyticsCategory === 'orders' && (<>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-6">
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-8 w-20 mb-4" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (<>
          {/* Order Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatNumberCard title="Total Orders" value={formatNumber(orderAnalytics.total)} subtitle={`${selectedYear} orders placed`} icon={Package} color="#3B82F6" trend="up" />
            <StatNumberCard title="Order Revenue" value={formatCurrency(orderAnalytics.totalRevenue)} subtitle={`Avg: ${formatCurrency(orderAnalytics.avgOrderValue)}`} icon={DollarSign} color="#10B981" />
            <StatNumberCard title="Completed" value={formatNumber(orderAnalytics.statusCounts['delivered'] || 0)} subtitle={`${orderAnalytics.total > 0 ? (((orderAnalytics.statusCounts['delivered'] || 0) / orderAnalytics.total) * 100).toFixed(0) : 0}% completion rate`} icon={CheckCircle2} color="#10B981" trend="up" />
            <StatNumberCard title="Pending" value={formatNumber((orderAnalytics.statusCounts['pending'] || 0) + (orderAnalytics.statusCounts['processing'] || 0) + (orderAnalytics.statusCounts['confirmed'] || 0))} subtitle="Awaiting fulfillment" icon={Clock} color="#F59E0B" />
          </div>

          {/* Order Status Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { status: 'pending', label: 'Pending', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-100' },
              { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { status: 'processing', label: 'Processing', icon: Activity, color: 'bg-purple-50 text-purple-700 border-purple-100' },
              { status: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
              { status: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              { status: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-100' },
            ].map(s => (
              <div key={s.status} className={`flex items-center gap-3 rounded-2xl border p-4 ${s.color} transition-all hover:shadow-md`}>
                <s.icon className="size-5 shrink-0" />
                <div>
                  <p className="text-lg font-black">{orderAnalytics.statusCounts[s.status] || 0}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Charts */}
          {(viewMode === 'line' || viewMode === 'bar') && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-zinc-50 px-6 py-5">
                <CardTitle className="text-xl font-black text-black flex items-center gap-2"><Package className="size-5 text-[#3B82F6]" /> Order Volume Trend</CardTitle>
                <CardDescription className="text-zinc-400 mt-1">{selectedYear} monthly orders & revenue</CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  {viewMode === 'line' ? (
                    <LineChart data={orderAnalytics.monthlyOrders}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                      <Line yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5, fill: '#3B82F6' }} activeDot={{ r: 7 }} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981' }} strokeDasharray="5 5" />
                    </LineChart>
                  ) : (
                    <BarChart data={orderAnalytics.monthlyOrders} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 700 }} />
                      <Bar dataKey="orders" name="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {viewMode === 'pie' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-zinc-50 px-6 py-5">
                  <CardTitle className="text-xl font-black text-black flex items-center gap-2"><PieChartIcon className="size-5 text-[#3B82F6]" /> Order Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={Object.entries(orderAnalytics.statusCounts).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v })).filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={70} outerRadius={140} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}>
                        {Object.entries(orderAnalytics.statusCounts).filter(([, v]) => v > 0).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                      <Legend wrapperStyle={{ fontSize: 13, fontWeight: 700, paddingTop: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-zinc-50 px-6 py-5">
                  <CardTitle className="text-xl font-black text-black flex items-center gap-2"><PieChartIcon className="size-5 text-[#3B82F6]" /> Payment Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={Object.entries(orderAnalytics.paymentStatusCounts).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v })).filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={70} outerRadius={140} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}>
                        {Object.entries(orderAnalytics.paymentStatusCounts).filter(([, v]) => v > 0).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                      <Legend wrapperStyle={{ fontSize: 13, fontWeight: 700, paddingTop: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {(viewMode === 'table' || viewMode === 'numbers') && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-zinc-50 px-6 py-5">
                <CardTitle className="text-xl font-black text-black flex items-center gap-2"><TableIcon className="size-5 text-[#3B82F6]" /> Monthly Order Breakdown</CardTitle>
                <CardDescription className="text-zinc-400 mt-1">{selectedYear} • All order statuses</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-zinc-50/30">
                        <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#3B82F6]">Month</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#3B82F6]">Orders</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#3B82F6]">Revenue</TableHead>
                        <TableHead className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-zinc-500">Avg / Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderAnalytics.monthlyOrders.map(m => (
                        <TableRow key={m.month} className="hover:bg-zinc-50/50 transition-colors">
                          <TableCell className="px-6 py-5 font-bold text-zinc-900">{m.month} {selectedYear}</TableCell>
                          <TableCell className="px-6 py-5 text-right font-black text-zinc-900">{m.orders}</TableCell>
                          <TableCell className="px-6 py-5 text-right font-bold text-zinc-600">{formatCurrency(m.revenue)}</TableCell>
                          <TableCell className="px-6 py-5 text-right font-bold text-zinc-500">{m.orders > 0 ? formatCurrency(m.revenue / m.orders) : '–'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-[#3B82F6]/5 border-t-2 border-[#3B82F6]/20">
                        <TableCell className="px-6 py-5 font-black text-[#3B82F6] text-sm uppercase tracking-wider">Total</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-[#3B82F6]">{orderAnalytics.total}</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-[#3B82F6]">{formatCurrency(orderAnalytics.totalRevenue)}</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black text-zinc-500">{formatCurrency(orderAnalytics.avgOrderValue)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>)}
      </>)}

      {/* ─── Print Styles ───────────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #analytics-report-area, #analytics-report-area * { visibility: visible; }
          #analytics-report-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          button, select, .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}} />
    </div>
  );
}
