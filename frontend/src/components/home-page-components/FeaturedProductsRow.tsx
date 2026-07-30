"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ShoppingCart } from "lucide-react";
import type { CartProductInput } from "@/src/types/cart";
import { getUserRole } from "@/src/lib/auth";
import {
  getActiveCurrency,
  formatPrice,
  getProductPath,
  productToCartLineItem,
  calculateDiscountAmount,
} from "@/src/lib/product-utils";
import { useCartStore } from "@/src/store/use-cart-store";
import { toast } from "sonner";

interface FeaturedProductsRowProps {
  products: CartProductInput[];
  title?: string;
  subtitle?: string;
}

const STORAGE_BASE =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

function resolveImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/storage/")) return `${STORAGE_BASE}${url}`;
  if (url.startsWith("storage/")) return `${STORAGE_BASE}/${url}`;
  return `${STORAGE_BASE}/storage/${url}`;
}

function getProductImage(product: any): string | null {
  const primary = product.images?.find((i: any) => i.is_primary)?.url;
  const first = product.images?.[0]?.url;
  return resolveImage(primary || first || product.image_url || null);
}

/* ── Inline mini card — matches the screenshot exactly ── */
function MiniProductCard({
  product,
  currency,
  role,
}: {
  product: CartProductInput;
  currency: "NPR" | "USD";
  role: string | null;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const isWholesaler = role === "wholesaler" || role === "wholeseller";

  const activeVariant =
    product.variants?.find((v: any) => v.is_active && (v.stock ?? 0) > 0) ??
    product.variants?.[0];

  const allOutOfStock = !product.variants?.some(
    (v: any) => v.is_active && (v.stock ?? 0) > 0
  );

  const rawBase =
    currency === "USD"
      ? isWholesaler
        ? (activeVariant?.international_wholesale_price ?? activeVariant?.international_price ?? activeVariant?.retail_price ?? 0)
        : (activeVariant?.international_price ?? activeVariant?.retail_price ?? 0)
      : isWholesaler
        ? (activeVariant?.wholesale_price ?? activeVariant?.retail_price ?? 0)
        : (activeVariant?.retail_price ?? 0);

  const basePrice = parseFloat(String(rawBase));

  const isIntlMissing =
    currency === "USD" &&
    (isWholesaler
      ? (Number(activeVariant?.international_wholesale_price) <= 0 || !activeVariant?.international_wholesale_price) &&
        (Number(activeVariant?.international_price) <= 0 || !activeVariant?.international_price)
      : Number(activeVariant?.international_price) <= 0 || !activeVariant?.international_price);

  if (isIntlMissing) return null;

  const activeDiscount =
    (activeVariant as any)?.discounts?.find((d: any) => d.is_active) ??
    (product as any).discounts?.find((d: any) => d.is_active) ??
    null;

  const discountAmount = calculateDiscountAmount(basePrice, activeDiscount, isWholesaler, currency);
  const finalPrice = Math.max(0, basePrice - discountAmount);
  const hasDiscount = discountAmount > 0;
  const discountPct = hasDiscount ? Math.round((discountAmount / basePrice) * 100) : 0;

  const lineItem = productToCartLineItem(product, { currency, role });
  const image = getProductImage(product as any);
  const href = getProductPath({ id: product.id, slug: product.slug });

  const stock = lineItem?.stock ?? 0;
  const quantityInCart = cartItems.find((i) => i.variantId === String(activeVariant?.id))?.quantity ?? 0;
  const remainingStock = Math.max(0, stock - quantityInCart);
  const isOutOfStock = allOutOfStock || remainingStock <= 0;
  const disabled = isOutOfStock || isIntlMissing;

  const category =
    (product as any).categories?.[0]?.name ??
    lineItem?.category ??
    "Uncategorized";

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lineItem || disabled) {
      toast.error(isOutOfStock ? "Out of stock" : "Cannot add to cart");
      return;
    }
    addItem({ ...lineItem, price: basePrice, discount: discountAmount, currency });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link href={href} className="group block h-full">
      <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
        {/* Image area */}
        <div className="relative bg-[#f3eeff] flex items-center justify-center p-3" style={{ height: 150 }}>
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-xs text-purple-400 font-medium text-center px-2">{product.name}</div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <span className="bg-gray-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                Out of Stock
              </span>
            </div>
          )}
          {!isOutOfStock && hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {discountPct}% OFF
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="px-3 pt-2 pb-3 flex flex-col flex-1">
          <p className="text-[10px] text-gray-400 mb-0.5 truncate">{category}</p>
          <p className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug min-h-[34px] group-hover:text-purple-700 transition-colors">
            {product.name}
          </p>

          <div className="mt-auto flex items-center justify-between gap-1 pt-2">
            <span className="text-[15px] font-black text-purple-700">
              {formatPrice(finalPrice, currency, 0)}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              disabled={disabled}
              className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                disabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              {!disabled && <ShoppingCart size={12} />}
              {isOutOfStock ? "Out" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Main section ── */
export default function FeaturedProductsRow({
  products,
  title = "Featured Products",
  subtitle = "Best Deal on",
}: FeaturedProductsRowProps) {
  const [role, setRole] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [mounted, setMounted] = useState(false);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRole(getUserRole());
    setCurrency(getActiveCurrency());
    const onChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", onChange);
    return () => window.removeEventListener("currency_changed", onChange);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [mounted]);

  if (!mounted) return null;

  const isWholesaler = role === "wholesaler" || role === "wholeseller";

  // In-stock filter
  const visible = products.filter((p: any) => {
    const hasStock = p.variants?.some((v: any) => v.is_active && (v.stock ?? 0) > 0);
    if (!hasStock) return false;
    if (currency === "USD") {
      return p.variants?.some((v: any) =>
        isWholesaler
          ? Number(v.international_wholesale_price) > 0 || Number(v.international_price) > 0
          : Number(v.international_price) > 0
      );
    }
    return true;
  });

  if (visible.length === 0) return null;

  // Build category pills
  const seenIds = new Set<string>();
  const pills: { id: string; name: string }[] = [];
  for (const p of visible) {
    for (const c of (p as any).categories ?? []) {
      const key = String(c.id);
      if (!seenIds.has(key)) {
        seenIds.add(key);
        pills.push({ id: key, name: c.name });
      }
    }
  }

  // Filter products by active tag
  const filtered = activeTagId
    ? visible.filter((p: any) => p.categories?.some((c: any) => String(c.id) === activeTagId))
    : visible;

  // Hero image — first product
  const heroProduct = visible[0] as any;
  const heroImage = getProductImage(heroProduct);
  const heroHref = getProductPath({ id: heroProduct?.id, slug: heroProduct?.slug });

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 340, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-4">
      <div
        className="rounded-2xl overflow-hidden bg-[#966FD6]"
      >
        {/* ── Header row ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pt-4 pb-3">
          {/* Title block */}
          <div className="shrink-0">
            <p className="text-[11px] font-medium text-purple-200 leading-none mb-0.5">{subtitle}</p>
            <h2 className="text-[18px] font-extrabold text-white leading-tight">{title}</h2>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {pills.slice(0, 5).map((pill) => (
              <button
                key={pill.id}
                onClick={() => setActiveTagId(activeTagId === pill.id ? null : pill.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeTagId === pill.id
                    ? "bg-white text-purple-700 border-white"
                    : "bg-transparent text-white border-white/50 hover:border-white hover:bg-white/10"
                }`}
              >
                {pill.name}
              </button>
            ))}
          </div>

          {/* View All */}
          <Link
            href="/products"
            className="shrink-0 text-[12px] font-semibold text-white hover:text-purple-200 transition-colors whitespace-nowrap"
          >
            View All
          </Link>
        </div>

        {/* ── Products row ── */}
        <div className="relative px-5 pb-5">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide"
            style={{ scrollBehavior: "smooth" }}
          >
            {/* Hero / featured image card — links to its product page */}
            {heroImage && (
              <Link
                href={heroHref}
                className="shrink-0 rounded-xl overflow-hidden flex items-center justify-center bg-purple-800/40 group cursor-pointer"
                style={{ width: 190, minWidth: 190, height: 240 }}
              >
                <img
                  src={heroImage}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
            )}

            {/* Product cards — skip the first product (already shown as hero) */}
            {filtered.slice(1, 13).map((product) => (
              <div
                key={product.id}
                className="shrink-0"
                style={{ width: 180, minWidth: 180, height: 240 }}
              >
                <MiniProductCard product={product} currency={currency} role={role} />
              </div>
            ))}
          </div>

          {/* Scroll right button */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
