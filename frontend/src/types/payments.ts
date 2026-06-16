export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: number | string;
  order_id: number | string;
  customer_name?: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  transaction_id?: string;
  created_at: string;
}

export interface PaymentFilters {
  status?: string;
  from?: string;
  to?: string;
  customer?: string;
  method?: string;
  page?: number;
}
