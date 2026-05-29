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

export interface OrderItem {
  id: number | string;
  product_id: number | string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string | null;
  variant_name?: string | null;
}

export interface Order {
  id: number | string;
  order_number?: string;
  customer?: string;
  total?: number | string;
  total_amount?: number | string;
  notes?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  address_id?: string;
  product_ids?: string[];
  items?: OrderItem[];
  order_items?: OrderItem[];
  user_id?: string;
  user_type?: string;
  created_at?: string;
}

export interface CreateOrderPayload {
  notes?: string | null;
  shipping_address: ShippingAddress;
  address_id?: string;
}

export interface CreateOrderResponse extends Order {}
