import type { CreateOrderPayload, CreateOrderResponse, Order, OrderStatus, PaymentStatus } from "@/src/types/orders";
import { getAuthToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function extractArray(data: any): Order[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
  return [];
}

// Admin: Fetch all orders with filters
export async function fetchAllOrdersAdmin(filters?: {
  status?: string;
  from?: string;
  to?: string;
  customer?: string;
  page?: number;
  token?: string;
}): Promise<any> {
  const token = filters?.token || getAuthToken();
  const query = new URLSearchParams();
  if (filters?.status) query.append("status", filters.status);
  if (filters?.from) query.append("from", filters.from);
  if (filters?.to) query.append("to", filters.to);
  if (filters?.customer) query.append("customer", filters.customer);
  if (filters?.page) query.append("page", filters.page.toString());
  query.append("per_page", "10");

  const queryString = query.toString();
  const res = await fetch(`${API_BASE}/admin/orders${queryString ? `?${queryString}` : ""}`, {
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch admin orders: ${res.status}`);
  const data = await res.json();
  return data;
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
  return data?.data?.order ?? data?.order ?? data?.data ?? data;
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
