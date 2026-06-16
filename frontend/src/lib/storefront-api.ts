import type {
  StorefrontCategory,
  StorefrontProduct,
  StorefrontSettings,
} from '@/src/types/storefront';
import type { PaymentSettings } from '@/src/types/payment-settings';
import { parsePaymentSettings } from './payment-settings';
import { Offer } from '../types/offer';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchCategories(): Promise<StorefrontCategory[]> {
  const json = await apiGet<{ data: StorefrontCategory[] }>('/categories');
  return json.data ?? [];
}

export async function fetchProducts(): Promise<StorefrontProduct[]> {
  const json = await apiGet<{ data: StorefrontProduct[] }>('/products');
  return json.data ?? [];
}

export async function fetchOffers(): Promise<Offer[]> {
  const json = await apiGet<{ data: Offer[] }>('/offers');
  return json.data ?? [];
}

export async function fetchProductBySlug(
  slugOrId: string
): Promise<StorefrontProduct | null> {
  const identifier = decodeURIComponent(slugOrId).trim();
  if (!identifier) return null;

  try {
    const json = await apiGet<{ data: StorefrontProduct }>(
      `/products/${encodeURIComponent(identifier)}`
    );
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchAllSettings(): Promise<{
  grouped: Record<string, Record<string, string | null>>;
  storefront: StorefrontSettings;
  payment: PaymentSettings;
}> {
  const json = await apiGet<{
    data: Record<string, Record<string, string | null>>;
  }>('/settings');

  const grouped = json.data ?? {};
  const general = grouped.general ?? {};
  const rawLogo = general.site_logo;
  const logo =
    typeof rawLogo === 'string' &&
    (rawLogo.startsWith('data:image') || rawLogo.startsWith('http'))
      ? rawLogo
      : null;

  // Flatten all settings into a single object to ensure we find keys like cod_active 
  // even if they are assigned to different groups in the backend
  const flatSettings: Record<string, string | null> = {};
  Object.keys(grouped).forEach(groupName => {
    Object.assign(flatSettings, grouped[groupName]);
  });

  return {
    grouped,
    storefront: {
      logo,
      contactPhone: general.contact_phone ?? '',
      metaDescription: general.meta_description ?? '',
      socialLinks: grouped.social ?? {},
    },
    payment: parsePaymentSettings(flatSettings),
  };
}

export function countProductsByCategory(
  products: StorefrontProduct[],
  categories: StorefrontCategory[]
): { category: StorefrontCategory; count: number }[] {
  return categories.map((category) => ({
    category,
    count: products.filter((p) =>
      p.categories?.some((c) => c.id === category.id)
    ).length,
  }));
}

export function getRelatedProducts(
  product: StorefrontProduct,
  allProducts: StorefrontProduct[],
  limit = 8
): StorefrontProduct[] {
  const categoryIds = new Set(product.categories?.map((c) => c.id) ?? []);
  return allProducts
    .filter((p) => p.id !== product.id)
    .filter((p) => p.categories?.some((c) => categoryIds.has(c.id)))
    .slice(0, limit);
}

export function getAlsoViewedProducts(
  product: StorefrontProduct,
  allProducts: StorefrontProduct[],
  limit = 8
): StorefrontProduct[] {
  return allProducts.filter((p) => p.id !== product.id).slice(0, limit);
}
