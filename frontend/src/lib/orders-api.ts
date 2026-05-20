import type { CreateOrderPayload, CreateOrderResponse, Order } from "@/types/orders";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  const data = await res.json();
  // Handle both { data: [] } and [] shapes
  return Array.isArray(data) ? data : (data.data ?? []);
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data?.data ?? data;
}
