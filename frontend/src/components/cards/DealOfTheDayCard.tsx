"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { useCartStore } from "@/src/store/use-cart-store";
import { toast } from "sonner";
import { productToCartLineItem, getProductPath, getActiveCurrency, formatPrice, calculateDiscountAmount } from "@/src/lib/product-utils";
import { CartProductInput } from "@/src/types/cart";
import { cn } from "@/src/lib/utils";
import { getUserRole } from "@/src/lib/auth";
import { useState, useEffect } from "react";

export interface DealProduct {
  id: number | string;
  name: string;
  slug?: string;
  // Product-level images
  image_url?: string;
  images?: { url?: string; image_path?: string; is_primary?: boolean }[];
  // Variant targeted by the deal
  deal_variant_image?: string;
  deal_variant_id?: string;
  // Pricing
  price?: number;
  variants?: {
    id?: string;
    retail_price: number;
    wholesale_price?: number;
    international_price?: number;
    moq?: number;
    stock?: number;
    image_url?: string;
    discounts?: { type: string; value: number; is_active: boolean }[];
  }[];
  // Meta
  reviews_count?: number;
  reviews_avg_rating?: number;
  brand?: { name: string } | string;
  categories?: { id: string; name: string; slug?: string }[];
  discounts?: { type: string; value: number; is_active: boolean }[];
  // Discount info attached by backend for this deal
  deal_discount_value?: number;
  deal_discount_type?: string;
}

interface Props {
  product: DealProduct;
}

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

function normalizeUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  if (raw.startsWith("http")) {
    try {
      const u = new URL(raw);
      if (u.pathname.startsWith("/storage")) return `${STORAGE_URL}${u.pathname}`;
      return raw;
    } catch {
      return raw;
    }
  }
  if (raw.startsWith("/")) return `${STORAGE_URL}${raw}`;
  return `${STORAGE_URL}/storage/${raw}`;
}

function resolveProductImage(product: DealProduct): string {
  if (product.deal_variant_image) {
    const u = normalizeUrl(product.deal_variant_image);
    if (u) return u;
  }
  if (product.deal_variant_id && product.variants) {
    const v = product.variants.find((x) => String(x.id) === String(product.deal_variant_id));
    if (v?.image_url) {
      const u = normalizeUrl(v.image_url);
      if (u) return u;
    }
  }
  // Try first variant image if no specific deal variant is set
  if (product.variants && product.variants.length > 0) {
    const v = product.variants[0];
    if (v.image_url) {
      const u = normalizeUrl(v.image_url);
      if (u) return u;
    }
  }
  if (product.image_url) {
    const u = normalizeUrl(product.image_url);
    if (u) return u;
  }

  // Gallery fallback (images only)
  const primary = product.images?.find((i) => i.is_primary && (i as any).type !== 'video');
  const firstImg = product.images?.find((i) => (i as any).type !== 'video');
  const raw = primary?.url || primary?.image_path || firstImg?.url || firstImg?.image_path;

  if (raw) {
    const u = normalizeUrl(raw);
    if (u) return u;
  }
  return "/placeholder.png";
}

function computePricing(product: DealProduct, isWholesaler: boolean = false, currency: string = 'NPR') {
  const variant = product.deal_variant_id && product.variants
    ? product.variants.find((x) => String(x.id) === String(product.deal_variant_id))
    : product.variants?.[0];

  const isUSD = currency === 'USD';
  let basePrice = product.price;

  if (variant) {
    basePrice = isUSD
      ? (variant.international_price ?? variant.retail_price)
      : (isWholesaler ? (variant.wholesale_price ?? variant.retail_price) : variant.retail_price);
  }

  if (basePrice == null) {
    const firstV = product.variants?.[0];
    if (firstV) {
      basePrice = isUSD
        ? (firstV.international_price ?? firstV.retail_price)
        : (isWholesaler ? (firstV.wholesale_price ?? firstV.retail_price) : firstV.retail_price);
    } else {
      basePrice = 0;
    }
  }

  const base = Number(basePrice || 0);
  let discountAmount = 0;

  if (isUSD) {
    const dealV = product.deal_variant_id
      ? product.variants?.find(v => String(v.id) === String(product.deal_variant_id))
      : product.variants?.[0];

    const active =
      dealV?.discounts?.find((d) => d.is_active) ||
      product.discounts?.find((d) => d.is_active);

    discountAmount = calculateDiscountAmount(base, active, isWholesaler, currency);
  } else if (isWholesaler) {
    discountAmount = 0;
  } else if (product.deal_discount_value != null) {
    if (product.deal_discount_type === "percentage" || product.deal_discount_type === "percent") {
      discountAmount = base * (product.deal_discount_value / 100);
    } else {
      discountAmount = Math.min(product.deal_discount_value, base);
    }
  } else {
    // Fallback to variant-level or product-level active discounts
    const dealV = product.deal_variant_id
      ? product.variants?.find(v => String(v.id) === String(product.deal_variant_id))
      : product.variants?.[0];

    const active =
      dealV?.discounts?.find((d) => d.is_active) ||
      product.discounts?.find((d) => d.is_active);

    if (active) {
      if (active.type === "percent" || active.type === "percentage") {
        discountAmount = base * (Number(active.value) / 100);
      } else {
        discountAmount = Math.min(Number(active.value), base);
      }
    }
  }

  const finalPrice = Math.max(0, base - discountAmount);
  const discountPct = discountAmount > 0 && base > 0 ? Math.round((discountAmount / base) * 100) : 0;

  return { basePrice: base, finalPrice, discountAmount, discountPct, hasDiscount: discountAmount > 0 };
}

export default function DealOfTheDayCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [role, setRole] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'NPR' | 'USD'>('NPR');

  useEffect(() => {
    setRole(getUserRole());
    setCurrency(getActiveCurrency());

    const handleCurrencyChange = () => {
      setCurrency(getActiveCurrency());
    };
    window.addEventListener('currency_changed', handleCurrencyChange);
    return () => window.removeEventListener('currency_changed', handleCurrencyChange);
  }, []);

  const isWholesaler = role === "wholesaler" || role === "wholeseller";
  const { basePrice, finalPrice, discountAmount, discountPct, hasDiscount } = computePricing(product, isWholesaler, currency);
  const rating = product.reviews_count && product.reviews_count > 0
    ? Math.round(product.reviews_avg_rating ?? 0)
    : 0;
  const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || "";

  const selectedVariant = product.deal_variant_id
    ? product.variants?.find(v => String(v.id) === String(product.deal_variant_id))
    : product.variants?.[0];

  const isUSD = currency === 'USD';
  const isInternationalPriceMissing = isUSD && (selectedVariant?.international_price === undefined || selectedVariant?.international_price === null || Number(selectedVariant?.international_price) <= 0);
  const isOutOfStock = (selectedVariant?.stock ?? 0) <= 0;
  const isPurchaseDisabled = isOutOfStock || isInternationalPriceMissing;

  // Don't render this card at all if the active currency has no price
  if (isInternationalPriceMissing) return null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUSD && isInternationalPriceMissing) {
      toast.error("International pricing not available for this item.");
      return;
    }

    // Use the deal variant if available
    let variant = product.variants?.[0];
    if (product.deal_variant_id && product.variants) {
      const found = product.variants.find((v) => String(v.id) === String(product.deal_variant_id));
      if (found) variant = found;
    }

    if (!variant?.id) {
      toast.error("This product has no purchasable variant.");
      return;
    }

    // Check stock for the selected variant
    if ((variant.stock ?? 0) <= 0) {
      toast.error("This item is currently out of stock.");
      return;
    }

    const lineItem = productToCartLineItem(
      product as unknown as CartProductInput,
      {
        variantId: String(variant.id),
        seller: brandName || "Store",
        discount: discountAmount,
        currency,
      }
    );

    if (lineItem) {
      const dealImg = resolveProductImage(product);
      if (dealImg !== "/placeholder.png") {
        lineItem.image = dealImg;
      }

      addItem(lineItem);
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error("Could not add item to cart.");
    }
  };

  let productPath = getProductPath({ id: String(product.id), slug: product.slug });
  if (product.deal_variant_id) {
    productPath += `?variant=${product.deal_variant_id}`;
  }

  return (
    <Link href={productPath} className="deal-card group block overflow-hidden rounded-2xl">
      <div className="h-full flex flex-col">
        {/* ── Image ─────────────────────────────────── */}
        <div className="deal-card__image-wrap relative">
          <Image
            src={resolveProductImage(product)}
            alt={product.name}
            fill
            unoptimized
            className="deal-card__img group-hover:scale-105 transition-transform duration-500"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Body ──────────────────────────────────── */}
        <div className="deal-card__body p-4 flex flex-col flex-grow">
          <h3 className="deal-card__title group-hover:text-[#8b5cf6] transition-colors">{product.name}</h3>

          <div className="deal-card__stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} fill={i < rating ? "#fbbf24" : "none"} stroke={i < rating ? "#fbbf24" : "#d1d5db"} strokeWidth={2} />
            ))}
            <span className="deal-card__reviews">({product.reviews_count ?? 0} reviews)</span>
          </div>

          {brandName && <p className="deal-card__brand">By <span>{brandName}</span></p>}

          <div className="deal-card__footer mt-auto">
            <div className="deal-card__price-wrap flex flex-col">
              {isInternationalPriceMissing ? (
                <span className="text-[10px] uppercase font-bold text-destructive">Pricing unavailable</span>
              ) : (
                <>
                  <span className="deal-card__price">{formatPrice(finalPrice, currency)}</span>
                  {hasDiscount && (
                    <div className="deal-card__discount-info">
                      <span className="deal-card__discount-pct">{discountPct}% OFF</span>
                      <span className="deal-card__original-price">{formatPrice(basePrice, currency)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              className={cn("deal-card__add-btn", isPurchaseDisabled && "opacity-50 cursor-not-allowed bg-zinc-400")}
              onClick={handleAddToCart}
              disabled={isPurchaseDisabled}
              title={isOutOfStock ? "Out of Stock" : isInternationalPriceMissing ? "Pricing unavailable" : "Add to cart"}
            >
              {isPurchaseDisabled ? null : <ShoppingCart size={14} />}
              {isOutOfStock ? "Out" : isInternationalPriceMissing ? "N/A" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}