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
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price: string | number;
  discount_amount: string | number;
  line_total: string | number;
  created_at?: string;
  updated_at?: string;
    variant?: {
      id: string;
      product_id: string;
      variant_name: string;
      sku: string;
      retail_price: string | number;
      wholesale_price: string | number;
      moq: number;
      stock: number;
      weight?: string | null;
      image_url?: string | null;
      is_active?: boolean;
      color?: { name: string };
      size?: { name: string };
      product?: {
        id: string;
        name: string;
        slug: string;
        description?: string | null;
        image_url?: string | null;
      };
    };
}

export interface Order {
  id: number | string;
  order_number: string;
  customer?: string;
  total_amount?: number;
  subtotal: string | number;
  discount_amount: string | number;
  total: string | number;
  notes?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  address_id?: string | null;
  product_ids?: string[];
  user_id?: string;
  user_type?: "retail" | "wholesale" | string;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string | null;
    company_name?: string | null;
    address?: string | null;
    is_verified?: boolean;
  };
  items?: OrderItem[];
}

export interface CreateOrderPayload {
  notes?: string | null;
  shipping_address: ShippingAddress;
  address_id?: string;
}

export interface CreateOrderResponse extends Order {}
