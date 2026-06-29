"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingCart,
  Share2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/src/store/use-cart-store";
import { productToCartLineItem, getActiveCurrency, formatPrice, calculateDiscountAmount, getDiscountDefinition } from "@/src/lib/product-utils";
import { getUserRole } from "@/src/lib/auth";
import type { StorefrontProduct } from "@/src/types/storefront";
import type { CartProductInput } from "@/src/types/cart";

interface ProductPurchasePanelProps {
  product: StorefrontProduct;
  reviewCount?: number;
  averageRating?: number;
  selectedVariantId: string;
  onVariantChange: (id: string) => void;
}

export default function ProductPurchasePanel({
  product,
  reviewCount = 0,
  averageRating = 0,
  selectedVariantId,
  onVariantChange,
}: ProductPurchasePanelProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const activeVariants = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active !== false),
    [product.variants]
  );

  const [quantity, setQuantity] = useState(1);
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

  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) ?? activeVariants[0];

  const isWholesaler = role === "wholesaler" || role === "wholeseller";
  const moq = selectedVariant?.moq ?? 1;
  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const exceedsStock = stock > 0 ? quantity > stock : false;

  // Sync quantity with MOQ for wholesalers when variant changes
  useEffect(() => {
    if (isWholesaler && selectedVariant) {
      setQuantity(selectedVariant.moq ?? 1);
    } else {
      setQuantity(1);
    }
  }, [isWholesaler, selectedVariant]);

  const isUSD = currency === 'USD';
  const isInternationalPriceMissing = isUSD && (selectedVariant?.international_price === undefined || selectedVariant?.international_price === null || selectedVariant?.international_price === '');

  const rawBasePrice = isUSD
    ? (selectedVariant?.international_price ?? selectedVariant?.retail_price ?? 0)
    : (isWholesaler
      ? (selectedVariant?.wholesale_price ?? selectedVariant?.retail_price ?? 0)
      : (selectedVariant?.retail_price ?? 0));
  const basePrice = parseFloat(String(rawBasePrice));

  // Calculate discount for all users (variant discount takes precedence over product discount)
  let activeDiscount = null;
  if (selectedVariant?.discounts && selectedVariant.discounts.length > 0) {
    activeDiscount = selectedVariant.discounts.find(d => d.is_active);
  }
  if (!activeDiscount && product.discounts && product.discounts.length > 0) {
    activeDiscount = product.discounts.find(d => d.is_active);
  }

  const discountAmount = calculateDiscountAmount(basePrice, activeDiscount, isWholesaler, currency);
  const price = basePrice - discountAmount;
  const compareAt = discountAmount > 0 ? basePrice : 0;

  let discountPct = 0;
  if (discountAmount > 0 && basePrice > 0) {
    const def = getDiscountDefinition(activeDiscount, isWholesaler, currency);
    if (def.type === 'percent') {
      discountPct = Math.round(def.value ?? 0);
    } else {
      discountPct = Math.round((discountAmount / basePrice) * 100);
    }
  }

  const cartInput: CartProductInput = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categories: product.categories,
    variants: product.variants,
    images: product.images,
  };

  const buildLineItem = () =>
    productToCartLineItem(cartInput, {
      variantId: selectedVariant?.id,
      quantity,
      discount: discountAmount,
      currency,
    });

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This variant is out of stock.");
      return;
    }
    if (quantity > stock) {
      toast.error(`Only ${stock} unit${stock === 1 ? "" : "s"} are available.`);
      return;
    }
    if (isWholesaler && quantity < moq) {
      toast.error(`Minimum order quantity for the item is ${moq}.`);
      return;
    }
    const line = buildLineItem();
    if (!line) {
      toast.error("Select a valid product option.");
      return;
    }
    addItem(line);
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error("This variant is out of stock.");
      return;
    }
    if (quantity > stock) {
      toast.error(`Only ${stock} unit${stock === 1 ? "" : "s"} are available.`);
      return;
    }
    if (isWholesaler && quantity < moq) {
      toast.error(`Minimum order quantity for the item is ${moq}.`);
      return;
    }
    const line = buildLineItem();
    if (!line) {
      toast.error("Select a valid product option.");
      return;
    }
    addItem(line);
    router.push("/cart");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="min-w-0">
      {product.brand && (
        <span className="text-xs font-semibold tracking-wider text-primary uppercase block mb-1">
          {product.brand.name}
        </span>
      )}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
        {product.name}
      </h1>

      <div className="flex items-center gap-2 mt-2">
        <div className="flex text-yellow-400">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={16}
              fill={i <= Math.round(averageRating) ? "currentColor" : "none"}
              className={i > Math.round(averageRating) ? "text-gray-300" : ""}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      </div>

      {isInternationalPriceMissing && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-medium">
          ⚠️ International (USD) pricing is not available for this variant. Please select a different variant or switch to NPR.
        </div>
      )}

      {!isInternationalPriceMissing && (
        <div className="flex flex-wrap items-end gap-2 mt-4">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(price, currency, 0)}
          </span>
          {discountPct > 0 && (
            <>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
                {discountPct}% off
              </span>
              <span className="text-gray-400 line-through text-sm">
                {formatPrice(compareAt, currency, 0)}
              </span>
            </>
          )}
        </div>
      )}

      {/* Variant Selection: Color Family & Size/Weight */}
      <div className="mt-6 space-y-6">
        {/* Color Family */}
        {(product.color || activeVariants.some(v => v.color)) && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Color Family: <span className="text-zinc-900 font-black ml-1">
                {selectedVariant?.color?.name || 'Default'}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {(() => {
                const uniqueColors = new Set<string>();
                return activeVariants.filter(v => {
                  const name = v.color?.name || product.color?.name || 'Default';
                  if (uniqueColors.has(name)) return false;
                  uniqueColors.add(name);
                  return true;
                }).map((variant) => {
                  const colorName = variant.color?.name || product.color?.name || 'Default';
                  const isSelected = (selectedVariant?.color?.name || product.color?.name || 'Default') === colorName;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => onVariantChange(variant.id)}
                      className={`group relative w-16 h-16 rounded-2xl border-2 transition-all p-1 overflow-hidden shrink-0 ${isSelected
                        ? "border-primary shadow-xl scale-110 z-10"
                        : "border-zinc-50 hover:border-zinc-200 bg-white"
                        }`}
                    >
                      {variant.image_url ? (
                        <div className="w-full h-full rounded-xl overflow-hidden">
                          <img
                            src={variant.image_url.startsWith('http') ? variant.image_url : `http://localhost:8000${variant.image_url}`}
                            className="w-full h-full object-cover"
                            alt={colorName}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-[10px] font-black text-zinc-300 rounded-xl uppercase">
                          {colorName.slice(0, 3)}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform scale-110 animate-in zoom-in-50 duration-200">
                            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 5L4.5 8.5L11 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Size or Weight (Whichever is available) */}
        {(() => {
          const hasSize = product.size || activeVariants.some(v => v.size);
          const hasWeight = product.weight || activeVariants.some(v => v.weight);

          if (!hasSize && !hasWeight) return null;

          // Prefer Size over Weight if both exist (standard e-commerce)
          const label = hasSize ? 'Size' : 'Weight';
          const property = hasSize ? 'size' : 'weight';

          return (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                {label}: <span className="text-zinc-900 font-black ml-1">
                  {(() => {
                    const val = selectedVariant[property as keyof typeof selectedVariant];
                    return typeof val === 'object' ? (val as any)?.name : (val as string) || (product as any)[property] || 'Default';
                  })()}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const currentColor = selectedVariant?.color?.name || product.color?.name || 'Default';

                  const uniqueOptions = [
                    ...new Set(
                      activeVariants.map(v =>
                        typeof v[property as keyof typeof v] === "object"
                          ? (v[property as keyof typeof v] as any)?.name
                          : (v[property as keyof typeof v] as string) || "Default"
                      )
                    ),
                  ];

                  return uniqueOptions.map(optionValue => {
                    const availableVariant = activeVariants.find(v => {
                      const color = v.color?.name || product.color?.name || "Default";

                      const value =
                        typeof v[property as keyof typeof v] === "object"
                          ? (v[property as keyof typeof v] as any)?.name
                          : (v[property as keyof typeof v] as string) || "Default";

                      return color === currentColor && value === optionValue;
                    });

                    const available = !!availableVariant;

                    const selectedValue =
                      typeof selectedVariant[property as keyof typeof selectedVariant] === "object"
                        ? (selectedVariant[property as keyof typeof selectedVariant] as any)?.name
                        : (selectedVariant[property as keyof typeof selectedVariant] as string) || "Default";

                    const isSelected = selectedValue === optionValue;

                    return (
                      <button
                        key={optionValue}
                        type="button"
                        disabled={!available}
                        onClick={() => available && onVariantChange(availableVariant!.id)}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${isSelected
                            ? "bg-primary text-white border-primary shadow-sm"
                            : available
                              ? "bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                              : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                          }`}
                      >
                        {optionValue}
                      </button>
                    );
                  });

                })()}

              </div>
            </div>
          );
        })()}

        {/* Fallback for generic variants if no color/size/weight */}
        {(!product.color && !product.size && !product.weight && !activeVariants.some(v => v.color || v.size || v.weight)) && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Options</h3>
            <div className="flex flex-wrap gap-2">
              {activeVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onVariantChange(variant.id)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border transition-all cursor-pointer ${selectedVariantId === variant.id
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-primary"
                    }`}
                >
                  {variant.variant_name || "Select"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2">
        {isOutOfStock ? (
          <p className="text-sm font-semibold text-red-600">Out of stock</p>
        ) : (
          <p className="text-sm text-gray-600">Available: {stock} unit{stock === 1 ? "" : "s"}</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(isWholesaler ? moq : 1, q - 1))}
            className="w-9 h-9 flex cursor-pointer items-center justify-center hover:bg-gray-100"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => {
              setQuantity((q) => {
                const next = q + 1;
                if (stock > 0 && next > stock) {
                  toast.error(`Only ${stock} unit${stock === 1 ? "" : "s"} are available.`);
                  return q;
                }
                return next;
              });
            }}
            className="w-9 h-9 cursor-pointer flex items-center justify-center hover:bg-gray-100"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock || exceedsStock || (isWholesaler && quantity < moq)}
          className="flex-1 min-w-[120px] bg-primary cursor-pointer text-white font-medium px-6 py-2.5 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Buy
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="w-10 h-10 cursor-pointer border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary"
          aria-label="Share product"
        >
          <Share2 size={18} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || exceedsStock || (isWholesaler && quantity < moq)}
          className="flex items-center justify-center gap-2 border border-primary text-primary px-5 py-2 rounded hover:bg-primary/5 text-sm font-medium disabled:opacity-50 cursor-pointer"
        >
          <ShoppingCart size={16} />
          Add to cart
        </button>
        {role !== "wholesaler" && (
          <Link
            href="/wholeseller_login"
            className="flex items-center justify-center border border-gray-300 text-gray-700 px-5 py-2 rounded hover:bg-gray-50 text-sm font-medium cursor-pointer"
          >
            Become Wholesaler
          </Link>
        )}
      </div>
    </div>
  );
}
