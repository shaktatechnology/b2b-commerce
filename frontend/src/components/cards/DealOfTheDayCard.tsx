"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { useCartStore } from "@/src/store/use-cart-store";
import { toast } from "sonner";
import { productToCartLineItem, getProductPath } from "@/src/lib/product-utils";
import { CartProductInput } from "@/src/types/cart";

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
  if (product.image_url) {
    const u = normalizeUrl(product.image_url);
    if (u) return u;
  }
  const primary = product.images?.find((i) => i.is_primary);
  const raw = primary?.url || primary?.image_path || product.images?.[0]?.url || product.images?.[0]?.image_path;
  if (raw) {
    const u = normalizeUrl(raw);
    if (u) return u;
  }
  return "/placeholder.png";
}

function computePricing(product: DealProduct) {
  const basePrice =
    product.price ??
    (product.variants && product.variants.length > 0
      ? Number(product.variants[0].retail_price)
      : 0);

  const base = Number(basePrice || 0);
  let discountAmount = 0;

  if (product.deal_discount_value != null) {
    if (product.deal_discount_type === "percentage") {
      discountAmount = base * (product.deal_discount_value / 100);
    } else {
      discountAmount = Math.min(product.deal_discount_value, base);
    }
  } else {
    const active =
      product.discounts?.find((d) => d.is_active) ||
      product.variants?.[0]?.discounts?.find((d) => d.is_active);
    
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
  const { basePrice, finalPrice, discountAmount, discountPct, hasDiscount } = computePricing(product);
  const rating = Math.round(product.reviews_avg_rating ?? 3.5);
  const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || "";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const variant = product.variants?.[0];
    if (!variant?.id) {
      toast.error("This product has no purchasable variant.");
      return;
    }

    const lineItem = productToCartLineItem(
      product as unknown as CartProductInput,
      {
        variantId: String(variant.id),
        seller: brandName || "Store",
        discount: discountAmount,
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

  const productPath = getProductPath({ id: String(product.id), slug: product.slug });

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
            <div className="deal-card__price-wrap">
              <span className="deal-card__price">Rs.{finalPrice.toLocaleString()}</span>
              {hasDiscount && (
                <div className="deal-card__discount-info">
                  <span className="deal-card__discount-pct">{discountPct}% OFF</span>
                  <span className="deal-card__original-price">Rs.{basePrice.toLocaleString()}</span>
                </div>
              )}
            </div>
            <button className="deal-card__add-btn" onClick={handleAddToCart} title="Add to cart">
              <ShoppingCart size={14} />
              Add
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}