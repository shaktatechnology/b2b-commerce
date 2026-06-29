"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/src/store/use-cart-store";
import {
  getProductPath,
  productToCartLineItem,
  getActiveCurrency,
  formatPrice,
  calculateDiscountAmount,
} from "@/src/lib/product-utils";
import { getUserRole } from "@/src/lib/auth";
import type { CartProductInput } from "@/src/types/cart";
import { cn } from "@/src/lib/utils";

interface ProductCardProps {
  product: CartProductInput;
  viewMode?: "grid" | "list";
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = "grid" }) => {
  const addItem = useCartStore((s) => s.addItem);
  const [mounted, setMounted] = React.useState(false);
  const [currency, setCurrency] = React.useState<"NPR" | "USD">("NPR");
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    setRole(getUserRole());
    setCurrency(getActiveCurrency());
    const onChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", onChange);
    return () => window.removeEventListener("currency_changed", onChange);
  }, []);

  const isWholesaler = role === "wholesaler" || role === "wholeseller";
  const isUSD = currency === "USD";

  const activeVariant = product.variants?.[0];

  // Choose the correct base price depending on user type + currency
  const rawBase = isUSD
    ? (activeVariant?.international_price ?? activeVariant?.retail_price ?? 0)
    : isWholesaler
      ? (activeVariant?.wholesale_price ?? activeVariant?.retail_price ?? 0)
      : (activeVariant?.retail_price ?? 0);
  const basePrice = parseFloat(String(rawBase));

  // International price missing guard
  const isInternationalPriceMissing =
    isUSD &&
    (activeVariant?.international_price === undefined ||
      activeVariant?.international_price === null ||
      activeVariant?.international_price === "" ||
      Number(activeVariant?.international_price) <= 0);

  // Discount calculation
  const activeDiscount =
    (activeVariant as any)?.discounts?.find((d: any) => d.is_active) ??
    (product as any).discounts?.find((d: any) => d.is_active) ??
    null;
  const discountAmount = calculateDiscountAmount(basePrice, activeDiscount, isWholesaler, currency);
  const finalPrice = Math.max(0, basePrice - discountAmount);
  const hasDiscount = discountAmount > 0;
  const discountPercent = hasDiscount ? Math.round((discountAmount / basePrice) * 100) : 0;

  const lineItem = productToCartLineItem(product, { currency });

  const image = lineItem?.image;
  const category = lineItem?.category ?? "Uncategorized";
  const href = getProductPath({ id: product.id, slug: product.slug });

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInternationalPriceMissing) {
      toast.error("International (USD) pricing is not available for this item.");
      return;
    }
    if (!lineItem) {
      toast.error("This product cannot be added to cart.");
      return;
    }

    if ((lineItem.stock ?? 0) <= 0) {
      toast.error("This item is currently out of stock.");
      return;
    }

    addItem({ ...lineItem, price: basePrice, discount: discountAmount, currency });
    toast.success(`${product.name} added to cart`);
  };

  const isOutOfStock = (lineItem?.stock ?? 0) <= 0;
  const isPurchaseDisabled = isOutOfStock || isInternationalPriceMissing;
  const avgRating = Number(product.reviews_avg_rating ?? 0);
  const reviewsCount = product.reviews_count ?? 0;

  // Don't render this card at all if the active currency has no price
  if (isInternationalPriceMissing) return null;

  if (viewMode === "list") {
    return (
      <Link href={href} className="group block h-full">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex gap-6 items-center h-full">
          <div className="w-40 h-40 shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2">
            {image ? (
              <img src={image} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
            ) : (
              <div className="text-center px-2">
                <p className="text-primary font-semibold text-sm">{product.name}</p>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium mb-1">{category}</p>
            <h3 className="text-xl font-bold text-gray-800 hover:text-primary transition-colors line-clamp-2">{product.name}</h3>

            {avgRating > 0 && (
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i <= Math.round(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">({reviewsCount} reviews)</span>
              </div>
            )}

            <div className="mt-4">
              <div className="flex flex-col">
                {isInternationalPriceMissing ? (
                  <span className="text-sm font-bold text-yellow-600">USD price unavailable</span>
                ) : (
                  <span className="text-2xl font-bold text-primary">{formatPrice(finalPrice, currency, 0)}</span>
                )}
                {!isInternationalPriceMissing && hasDiscount && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{discountPercent}% off</span>
                    <span className="text-sm text-gray-400 line-through">{formatPrice(basePrice, currency, 0)}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              By <span className="text-primary font-medium">{(product as any).brand?.name || "Nepal organic"}</span>
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleAdd}
                disabled={isPurchaseDisabled}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer",
                  isPurchaseDisabled ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {isPurchaseDisabled ? null : <ShoppingCart size={16} />}
                {isOutOfStock ? "Out of Stock" : isInternationalPriceMissing ? "Unavailable" : "Add to Cart"}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="px-5 py-2 border border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-all cursor-pointer"
              >
                Become Whole Seller
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block h-full">
      <div className="border rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden h-full flex flex-col">
        <div className="h-48 bg-gray-50 flex items-center justify-center p-4 relative">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="text-center px-2">
              <p className="text-primary font-semibold text-sm">{product.name}</p>
            </div>
          )}
          {hasDiscount && !isInternationalPriceMissing && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              {discountPercent}% OFF
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{category}</p>

          <h3 className="text-[15px] font-bold text-gray-800 line-clamp-2 hover:text-primary transition-colors min-h-[40px]">
            {product.name}
          </h3>

          {avgRating > 0 && (
            <div className="flex items-center gap-0.5 my-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={10}
                  className={
                    i <= Math.round(avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }
                />
              ))}
              {reviewsCount > 0 && (
                <span className="text-[10px] text-gray-400 ml-1">({reviewsCount})</span>
              )}
            </div>
          )}

          <div className="mt-auto space-y-0.5">
            {isInternationalPriceMissing ? (
              <p className="text-yellow-600 font-bold text-sm">USD price unavailable</p>
            ) : (
              <p className="text-primary font-black text-lg">
                {formatPrice(finalPrice, currency, 0)}
              </p>
            )}
            {!isInternationalPriceMissing && hasDiscount && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-red-500">{discountPercent}% off</span>
                <span className="text-[11px] text-gray-400 line-through">{formatPrice(basePrice, currency, 0)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 flex items-center justify-between border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
              By <span className="text-primary font-medium">{(product as any).brand?.name || "Store"}</span>
            </p>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isPurchaseDisabled}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer",
                isPurchaseDisabled ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {isPurchaseDisabled ? null : <ShoppingCart size={14} />}
              {isOutOfStock ? "Out" : isInternationalPriceMissing ? "N/A" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
