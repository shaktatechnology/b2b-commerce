import type { CreateOrderPayload, CreateOrderResponse, Order, OrderStatus, PaymentStatus } from "@/src/types/orders";
import { getAuthToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function extractArray(data: any): Order[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
  return [];
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
}

// Admin: Fetch all orders with filters
export async function fetchAllOrdersAdmin(filters?: {
  status?: string;
  from?: string;
  to?: string;
  customer?: string;
  page?: number;
  user_type?: string;
}): Promise<PaginatedOrdersResponse> {
  const token = getAuthToken();
  const query = new URLSearchParams();
  if (filters?.status) query.append("status", filters.status);
  if (filters?.from) query.append("from", filters.from);
  if (filters?.to) query.append("to", filters.to);
  if (filters?.customer) query.append("customer", filters.customer);
  if (filters?.page) query.append("page", filters.page.toString());
  if (filters?.user_type) query.append("user_type", filters.user_type);

  const queryString = query.toString();
  const res = await fetch(`${API_BASE}/admin/orders${queryString ? `?${queryString}` : ""}`, {
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch admin orders: ${res.status}`);
  const rawData = await res.json();

  let orders: Order[] = [];
  let total = 0;
  let lastPage = 1;
  let currentPage = 1;
  let perPage = 15;

  if (Array.isArray(rawData)) {
    orders = rawData;
    total = rawData.length;
  } else if (rawData?.data) {
    if (Array.isArray(rawData.data)) {
      orders = rawData.data;
      total = rawData.data.length;
    } else if (rawData.data?.data && Array.isArray(rawData.data.data)) {
      orders = rawData.data.data;
      total = rawData.data.total ?? orders.length;
      lastPage = rawData.data.last_page ?? 1;
      currentPage = rawData.data.current_page ?? 1;
      perPage = rawData.data.per_page ?? 15;
    }
  }

  return {
    orders,
    total,
    lastPage,
    currentPage,
    perPage
  };
}

// User: Fetch own orders
export async function fetchUserOrders(): Promise<Order[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/orders`, {
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  const data = await res.json();
  return extractArray(data);
}

// User: Fetch single order by ID
export async function fetchOrderById(id: string | number): Promise<Order> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch order details: ${res.status}`);
  const data = await res.json();
  return data?.data?.data ?? data?.data ?? data;
}

// User: Create order (checkout)
export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data?.data?.data ?? data?.data ?? data;
}

// Admin: Update order status/payment
export async function updateOrderAdmin(
  id: string | number,
  payload: { status?: OrderStatus | null; payment_status?: PaymentStatus | null }
): Promise<Order> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Update failed: ${res.status}`);
  }
  const data = await res.json();
  return data?.data?.data ?? data?.data ?? data;
}
