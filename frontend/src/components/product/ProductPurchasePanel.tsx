"use client";

import { useMemo, useState } from "react";
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
import { productToCartLineItem } from "@/src/lib/product-utils";
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

  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) ?? activeVariants[0];

  const basePrice = parseFloat(String(selectedVariant?.retail_price ?? 0));
  
  // Calculate discount
  let activeDiscount = null;
  if (selectedVariant?.discounts && selectedVariant.discounts.length > 0) {
      activeDiscount = selectedVariant.discounts.find(d => d.is_active);
  }
  if (!activeDiscount && product.discounts && product.discounts.length > 0) {
      activeDiscount = product.discounts.find(d => d.is_active);
  }

  let price = basePrice;
  let compareAt = 0;
  let discountPct = 0;

  if (activeDiscount) {
      const discountValue = Number(activeDiscount.value);
      if (activeDiscount.type === 'percent') {
          price = basePrice - (basePrice * (discountValue / 100));
          compareAt = basePrice;
          discountPct = Math.round(discountValue);
      } else if (activeDiscount.type === 'fixed') {
          price = Math.max(0, basePrice - discountValue);
          compareAt = basePrice;
          discountPct = basePrice > 0 ? Math.round((discountValue / basePrice) * 100) : 0;
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
    });

  const handleAddToCart = () => {
    const line = buildLineItem();
    if (!line) {
      toast.error("Select a valid product option.");
      return;
    }
    addItem(line);
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
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

      <div className="flex flex-wrap items-end gap-2 mt-4">
        <span className="text-3xl font-bold text-primary">
          Rs.{price.toFixed(0)}
        </span>
        {discountPct > 0 && (
          <>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
              {discountPct}% off
            </span>
            <span className="text-gray-400 line-through text-sm">
              Rs.{compareAt}
            </span>
          </>
        )}
      </div>

      {(product.long_description || product.description) && (
        <p className="text-sm text-gray-600 mt-4 line-clamp-4">
          {(product.long_description || product.description || "").replace(/<[^>]+>/g, "").slice(0, 280)}
          {(product.long_description || product.description || "").length > 280 ? "…" : ""}
        </p>
      )}

      {activeVariants.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-4">
            {(product.color || activeVariants.some(v => v.color)) && (
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">Color</p>
                <div className="flex flex-wrap gap-2">
                  {/* Group variants by color to avoid duplicates if possible, or just list all variant options */}
                  {Array.from(new Set(activeVariants.map(v => (v.color?.name || product.color?.name || 'Default')))).map(colorName => {
                    const vForColor = activeVariants.find(v => (v.color?.name || product.color?.name || 'Default') === colorName);
                    if (!vForColor) return null;
                    return (
                        <button
                        key={colorName}
                        type="button"
                        onClick={() => onVariantChange(vForColor.id)}
                        className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                            selectedVariantId === vForColor.id || (selectedVariant?.color?.name || product.color?.name || 'Default') === colorName
                            ? "bg-primary text-white border-primary"
                            : "border-gray-300 text-gray-700 hover:border-primary"
                        }`}
                        >
                        {colorName}
                        </button>
                    )
                  })}
                </div>
              </div>
            )}
            {(product.size || activeVariants.some(v => v.size)) && (
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(activeVariants.map(v => (v.size?.name || product.size?.name || 'Default')))).map(sizeName => {
                    // Try to find a variant matching both current color (if selected) and this new size
                    const currentColorName = selectedVariant?.color?.name || product.color?.name || 'Default';
                    let vForSize = activeVariants.find(v => (v.color?.name || product.color?.name || 'Default') === currentColorName && (v.size?.name || product.size?.name || 'Default') === sizeName);
                    // Fallback to any variant with this size if no matching color
                    if (!vForSize) vForSize = activeVariants.find(v => (v.size?.name || product.size?.name || 'Default') === sizeName);
                    if (!vForSize) return null;
                    
                    return (
                        <button
                        key={sizeName}
                        type="button"
                        onClick={() => onVariantChange(vForSize.id)}
                        className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                            (selectedVariant?.size?.name || product.size?.name || 'Default') === sizeName
                            ? "bg-primary text-white border-primary"
                            : "border-gray-300 text-gray-700 hover:border-primary"
                        }`}
                        >
                        {sizeName}
                        </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          
          {(!product.color && !product.size && !activeVariants.some(v => v.color || v.size)) && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">Options</p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => onVariantChange(variant.id)}
                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                      selectedVariantId === variant.id
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 text-gray-700 hover:border-primary"
                    }`}
                  >
                    {variant.variant_name || (variant.weight || product.weight ? `${variant.weight || product.weight}` : "Default")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 min-w-[120px] bg-primary text-white font-medium px-6 py-2.5 rounded hover:opacity-90"
        >
          Buy
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary"
          aria-label="Share product"
        >
          <Share2 size={18} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex items-center justify-center gap-2 border border-primary text-primary px-5 py-2 rounded hover:bg-primary/5 text-sm font-medium"
        >
          <ShoppingCart size={16} />
          Add to cart
        </button>
        <Link
          href="/wholeseller_login"
          className="flex items-center justify-center border border-gray-300 text-gray-700 px-5 py-2 rounded hover:bg-gray-50 text-sm font-medium"
        >
          Become Wholesaler
        </Link>
      </div>
    </div>
  );
}
