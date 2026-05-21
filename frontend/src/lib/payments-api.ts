import type { Payment, PaymentFilters } from "@/src/types/payments";
import { getAuthToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function extractArray(data: any): Payment[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
  return [];
}

export async function fetchAllPaymentsAdmin(filters?: PaymentFilters): Promise<Payment[]> {
  const token = getAuthToken();
  const query = new URLSearchParams();
  if (filters?.status) query.append("status", filters.status);
  if (filters?.from) query.append("from", filters.from);
  if (filters?.to) query.append("to", filters.to);
  if (filters?.customer) query.append("customer", filters.customer);
  if (filters?.page) query.append("page", filters.page.toString());

  const queryString = query.toString();
  const res = await fetch(`${API_BASE}/admin/payments${queryString ? `?${queryString}` : ""}`, {
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch payments: ${res.status}`);
  const data = await res.json();
  return extractArray(data);
}

export async function fetchPaymentDetailsAdmin(id: string | number): Promise<Payment> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/payments/${id}`, {
    headers: {
      "Accept": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch payment details: ${res.status}`);
  const data = await res.json();
  return data?.data ?? data;
}
