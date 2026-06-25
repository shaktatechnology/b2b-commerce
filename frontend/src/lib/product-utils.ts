import type { CartLineItem, CartProductInput } from '@/src/types/cart';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:8000';

export function resolveProductImageUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
  return `${BACKEND_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

import { getUserRole } from '@/src/lib/auth';

export function productToCartLineItem(
  product: CartProductInput,
  options?: {
    variantId?: string;
    quantity?: number;
    seller?: string;
    discount?: number;
  }
): CartLineItem | null {
  const seller = options?.seller ?? 'Store';
  const variant =
    product.variants?.find((v) => String(v.id) === String(options?.variantId)) ??
    product.variants?.[0];

  if (!variant?.id) return null;

  const role = getUserRole();
  const isWholesaler = role === 'wholesaler' || role === 'wholeseller';

  const rawPrice = isWholesaler
    ? (variant.wholesale_price ?? variant.retail_price ?? 0)
    : (variant.retail_price ?? 0);
  const basePrice = parseFloat(String(rawPrice));
  const image = resolveProductImageUrl(
    variant.image_url ?? 
    product.images?.find(img => img.is_primary && img.type === 'image')?.url ??
    product.images?.find(img => img.type === 'image')?.url ??
    product.images?.[0]?.url ??
    (product as any).image_url ?? 
    null
  );

  // Auto-calculate discount from product/variant discount data if not explicitly provided
  let discount = options?.discount ?? 0;

  // Rule: Wholesalers do not get retail discounts
  if (isWholesaler) {
    discount = 0;
  } else if (discount === 0 && options?.discount === undefined) {
    // Check variant-level discounts first, then product-level
    let activeDiscount = variant.discounts?.find((d) => d.is_active) ?? null;
    if (!activeDiscount) {
      activeDiscount = product.discounts?.find((d) => d.is_active) ?? null;
    }
    if (activeDiscount) {
      const discountValue = Number(activeDiscount.value);
      if (activeDiscount.type === 'percent') {
        discount = basePrice * (discountValue / 100);
      } else if (activeDiscount.type === 'fixed') {
        discount = Math.min(discountValue, basePrice);
      }
    }
  }

  return {
    productId: String(product.id),
    variantId: String(variant.id),
    name: product.name,
    category: product.categories?.[0]?.name ?? 'Uncategorized',
    price: Number.isFinite(basePrice) ? basePrice : 0,
    discount,
    quantity: options?.quantity ?? (isWholesaler ? (variant.moq ?? 1) : 1),
    image,
    seller,
    moq: variant.moq,
    stock: variant.stock ?? 0,
  };
}

export function getProductDisplayImages(product: CartProductInput): string[] {
  const topLevel = resolveProductImageUrl(product.images?.[0]?.url ?? product.images?.[0]?.image_path);
  const fromProduct = (product.images ?? [])
    .map((img) => resolveProductImageUrl(img.url ?? img.image_path))
    .filter((url): url is string => Boolean(url));

  const fromVariants = (product.variants ?? [])
    .map((v) => resolveProductImageUrl(v.image_url))
    .filter((url): url is string => Boolean(url));

  const merged = [
    ...(topLevel ? [topLevel] : []),
    ...fromProduct,
    ...fromVariants,
  ];
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
