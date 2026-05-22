export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: number | string;
  customer?: string;
  total_amount?: number;
  notes?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  created_at?: string;
}

export interface CreateOrderPayload {
  notes?: string | null;
  shipping_address: ShippingAddress;
}

export interface CreateOrderResponse extends Order {}
