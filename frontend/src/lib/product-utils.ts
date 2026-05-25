import type { CartLineItem, CartProductInput } from '@/src/types/cart';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:8000';

export function resolveProductImageUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
  return `${BACKEND_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

export function productToCartLineItem(
  product: CartProductInput,
  options?: {
    variantId?: string;
    quantity?: number;
    seller?: string;
  }
): CartLineItem | null {
  const seller = options?.seller ?? 'Store';
  const variant =
    product.variants?.find((v) => String(v.id) === String(options?.variantId)) ??
    product.variants?.[0];

  if (!variant?.id) return null;

  const price = parseFloat(String(variant.retail_price ?? 0));
  const image = resolveProductImageUrl(
    variant.image_url ?? product.images?.[0]?.url ?? null
  );

  return {
    productId: String(product.id),
    variantId: String(variant.id),
    name: product.name,
    category: product.categories?.[0]?.name ?? 'Uncategorized',
    price: Number.isFinite(price) ? price : 0,
    quantity: options?.quantity ?? 1,
    image,
    seller,
  };
}

export function getProductDisplayImages(product: CartProductInput): string[] {
  const fromProduct = (product.images ?? [])
    .map((img) => resolveProductImageUrl(img.url))
    .filter((url): url is string => Boolean(url));

  const fromVariants = (product.variants ?? [])
    .map((v) => resolveProductImageUrl(v.image_url))
    .filter((url): url is string => Boolean(url));

  const merged = [...fromProduct, ...fromVariants];
  return merged.length > 0 ? [...new Set(merged)] : [];
}

export function formatRs(amount: number, decimals = 2): string {
  return `Rs. ${amount.toFixed(decimals)}`;
}

export function getProductPath(product: {
  slug?: string | null;
  id: string;
}): string {
  const key = product.slug?.trim() || product.id;
  return `/products/${encodeURIComponent(key)}`;
}
