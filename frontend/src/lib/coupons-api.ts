import type {
  Coupon,
  CouponPayload,
  CouponRedemption,
  CouponStatus,
  RelationOption,
} from '@/src/types/coupon';
import { getAuthToken } from './auth';

// NOTE: matches orders-api.ts — API_BASE already includes /api, so every
// path below starts with /admin/... (not /api/admin/...). That mismatch
// was the cause of the earlier "route api/api/admin/coupons" 404.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
  return [];
}

function extractObject(data: any): any {
  return data?.data?.data ?? data?.data ?? data;
}

/* ── Coupons CRUD ─────────────────────────────────────────────────────── */

export async function fetchCoupons(): Promise<Coupon[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/coupons`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch coupons: ${res.status}`);
  const data = await res.json();
  return extractArray(data);
}

export async function fetchCoupon(id: string): Promise<Coupon> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/coupons/${id}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch coupon: ${res.status}`);
  const data = await res.json();
  return extractObject(data);
}

export async function createCoupon(
  payload: CouponPayload
): Promise<{ secure_code: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Create failed: ${res.status}`);
  }
  const data = await res.json();
  return { secure_code: data?.secure_code };
}

export async function updateCoupon(
  id: string,
  payload: Partial<CouponPayload>
): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/coupons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Update failed: ${res.status}`);
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/coupons/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Delete failed: ${res.status}`);
  }
}

export async function setCouponStatus(
  id: string,
  status: CouponStatus
): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/coupons/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Status update failed: ${res.status}`);
  }
}

export async function generateCouponCode(length = 8): Promise<string> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/coupons/generate-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ length }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Code generation failed: ${res.status}`);
  }
  const data = await res.json();
  return data?.data?.customer_code;
}

export async function fetchCouponRedemptions(
  id: string
): Promise<CouponRedemption[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/coupons/${id}/redemptions`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch redemptions: ${res.status}`);
  const data = await res.json();
  return extractArray(data);
}

/** Public/storefront validation endpoint — handy for a "test this coupon" panel. */
export async function validateCoupon(params: {
  code: string;
  subtotal: number;
  shipping_address: any;
  items?: any[];
  payment_method?: string;
}): Promise<{ message: string; valid: boolean; data?: any }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/coupons/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { message: data?.message ?? `Invalid coupon: ${res.status}`, valid: false };
  }
  return { message: data?.message ?? 'Coupon is valid', valid: true, data: data.data };
}

/* ── Relation option fetchers (for the product/category/user pickers) ───
   Products & categories: your admin routes turned out to require POST
   (admin/products errored "GET not supported"), so these use the public
   storefront endpoints instead (GET, no auth, same shape as
   storefront-api.ts's fetchProducts/fetchCategories) — safe for populating
   a picker list either way.

   Users: still assumed to be GET /admin/users, mirroring the working
   GET /admin/orders pattern in orders-api.ts. If this 405s the same way
   products did, it likely needs the same POST-with-body treatment —
   paste whichever file has the real admin users list call and I'll fix it.

   Brands: left out. Sidebar.tsx has Brands (and Colors/Sizes) commented
   out of nav, so there's probably no brands resource on the backend yet.
   Say the word if there is one and I'll add getBrandOptions + the picker
   back into CouponFormModal. ─────────────────────────────────────────── */

async function fetchPublicOptionList(
  path: string,
  labelKey: string = 'name'
): Promise<RelationOption[]> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to fetch options: ${res.status}`);
  const data = await res.json();
  const list = extractArray(data);
  return list.map((item) => ({
    id: item.id,
    label: item[labelKey] ?? item.name ?? item.title ?? item.id,
  }));
}

async function fetchAdminOptionList(
  path: string,
  labelKey: string = 'name'
): Promise<RelationOption[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch options: ${res.status}`);
  const data = await res.json();
  const list = extractArray(data);
  return list.map((item) => ({
    id: item.id,
    label: item[labelKey] ?? item.name ?? item.title ?? item.id,
  }));
}

export const getProductOptions = () => fetchPublicOptionList('/products', 'name');

export const getCategoryOptions = () =>
  fetchPublicOptionList('/categories', 'name');

export const getUserOptions = () => fetchAdminOptionList('/admin/users', 'name');