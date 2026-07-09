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

export function getActiveCurrency(): 'NPR' | 'USD' {
  if (typeof window === 'undefined') return 'NPR';
  
  // 1. Check explicit user preference in localStorage
  try {
    const chosen = localStorage.getItem('currency_preference');
    if (chosen === 'USD' || chosen === 'NPR') {
      return chosen;
    }
  } catch (e) {}

  // 2. Check saved shipping address country
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('b2b_shipping_address')) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.country) {
            if (parsed.country.toLowerCase() !== 'nepal') {
              return 'USD';
            } else {
              return 'NPR';
            }
          }
        }
      }
    }
  } catch (e) {}

  return 'NPR';
}

export function formatPrice(amount: number, currency: string = 'NPR', decimals = 2): string {
  return currency.toUpperCase() === 'USD' ? `$ ${amount.toFixed(decimals)}` : `Rs. ${amount.toFixed(decimals)}`;
}

export function getDiscountDefinition(
  discount: any,
  isWholesaler: boolean,
  currency: string
): { type: 'percent' | 'fixed' | null; value: number | null } {
  if (!discount || !discount.is_active) {
    return { type: null, value: null };
  }

  const isInternational = currency.toUpperCase() === 'USD';

  if (isWholesaler && isInternational) {
    return {
      type: discount.wholesale_international_type || null,
      value: discount.wholesale_international_value !== undefined && discount.wholesale_international_value !== null ? Number(discount.wholesale_international_value) : null
    };
  }

  if (isWholesaler) {
    return {
      type: discount.wholesale_type || null,
      value: discount.wholesale_value !== undefined && discount.wholesale_value !== null ? Number(discount.wholesale_value) : null
    };
  }

  if (isInternational) {
    return {
      type: discount.international_type || null,
      value: discount.international_value !== undefined && discount.international_value !== null ? Number(discount.international_value) : null
    };
  }

  return {
    type: discount.type || null,
    value: discount.value !== undefined && discount.value !== null ? Number(discount.value) : null
  };
}

export function calculateDiscountAmount(
  price: number,
  discount: any,
  isWholesaler: boolean,
  currency: string
): number {
  const { type, value } = getDiscountDefinition(discount, isWholesaler, currency);

  if (type === null || value === null || value === 0) {
    return 0;
  }

  const amount = type === 'percent'
    ? Number((price * (value / 100)).toFixed(2))
    : Number(value);

  return Math.min(amount, price);
}

export function productToCartLineItem(
  product: CartProductInput,
  options?: {
    variantId?: string;
    quantity?: number;
    seller?: string;
    discount?: number;
    currency?: string;
  }
): CartLineItem | null {
  const seller = options?.seller ?? 'Store';
  const variant =
    product.variants?.find((v) => String(v.id) === String(options?.variantId)) ??
    product.variants?.[0];

  if (!variant?.id) return null;

  const role = getUserRole();
  const isWholesaler = role === 'wholesaler' || role === 'wholeseller';
  const currency = options?.currency ?? getActiveCurrency();

  const isUSD = currency.toUpperCase() === 'USD';

  const rawPrice = isUSD
    ? (isWholesaler
      ? ((variant as any).international_wholesale_price ?? variant.international_price ?? variant.retail_price ?? 0)
      : (variant.international_price ?? variant.retail_price ?? 0))
    : (isWholesaler
      ? (variant.wholesale_price ?? variant.retail_price ?? 0)
      : (variant.retail_price ?? 0));
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
  let activeDiscount = variant.discounts?.find((d) => d.is_active) ?? null;
  if (!activeDiscount) {
    activeDiscount = product.discounts?.find((d) => d.is_active) ?? null;
  }

  // Pre-calculate both NPR and USD prices & discounts
  const rawPriceNpr = isWholesaler
    ? (variant.wholesale_price ?? variant.retail_price ?? 0)
    : (variant.retail_price ?? 0);
  const basePriceNpr = parseFloat(String(rawPriceNpr));
  const discountNpr = calculateDiscountAmount(basePriceNpr, activeDiscount, isWholesaler, 'NPR');

  const rawPriceUsd = isWholesaler
    ? ((variant as any).international_wholesale_price ?? variant.international_price ?? 0)
    : (variant.international_price ?? 0);
  const basePriceUsd = parseFloat(String(rawPriceUsd));
  const discountUsd = calculateDiscountAmount(basePriceUsd, activeDiscount, isWholesaler, 'USD');

  let discount = options?.discount ?? 0;
  if (options?.discount === undefined) {
    discount = isUSD ? discountUsd : discountNpr;
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
    currency,
    prices: {
      NPR: Number.isFinite(basePriceNpr) ? basePriceNpr : 0,
      USD: Number.isFinite(basePriceUsd) ? basePriceUsd : 0,
    },
    discounts: {
      NPR: Number.isFinite(discountNpr) ? discountNpr : 0,
      USD: Number.isFinite(discountUsd) ? discountUsd : 0,
    },
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
  const currency = getActiveCurrency();
  return formatPrice(amount, currency, decimals);
}

export function getProductPath(product: {
  slug?: string | null;
  id: string;
}): string {
  const key = product.slug?.trim() || product.id;
  return `/products/${encodeURIComponent(key)}`;
}
