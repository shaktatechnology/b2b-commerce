export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

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
  notes?: string | null;
  status: OrderStatus;
  shipping_address: ShippingAddress;
  created_at?: string;
}

export interface CreateOrderPayload {
  notes?: string | null;
  shipping_address: ShippingAddress;
}

export interface CreateOrderResponse extends Order {}
