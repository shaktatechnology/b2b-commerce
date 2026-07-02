export interface TopSellingProduct {
  id: string | number;
  name: string;
  slug?: string;
  total_sold: number;
  total_revenue: number;
  image_url?: string | null;
}

export interface LowStockProduct {
  id: string | number;
  name: string;
  slug?: string;
  variant_name?: string;
  sku?: string;
  stock: number;
  image_url?: string | null;
}

export interface DiscountTimeLeft {
  discount_id: string;
  ends_at: string;
  seconds_remaining: number | null;
}

export interface DashboardStatistics {
  total_revenue: number;
  todays_revenue: number;
  monthly_revenue: number;
  total_orders: number;
  pending_orders: number;
  paid_orders: number;
  completed_orders: number;
  total_customers: number;
  settled_today: number;
  settled_today_amount: number;
  pending_collections: number;
  total_discount_amount: number;
  active_discounts: number;
  discount_time_left: DiscountTimeLeft | null;
  npr_count: number;
  usd_count: number;
  top_selling_products: TopSellingProduct[];
  low_stock_products: LowStockProduct[];
}

export interface DashboardStatisticsResponse {
  message: string;
  data: DashboardStatistics;
}
