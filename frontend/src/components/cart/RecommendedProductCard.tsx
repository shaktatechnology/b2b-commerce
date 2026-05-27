"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { CartProductInput } from "@/src/types/cart";
import { productToCartLineItem, getProductPath } from "@/src/lib/product-utils";
import { useCartStore } from "@/src/store/use-cart-store";
import { toast } from "sonner";

interface RecommendedProductCardProps {
  product: CartProductInput;
}

export default function RecommendedProductCard({
  product,
}: RecommendedProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const retailVariant = product.variants?.[0];
  const retailPrice = parseFloat(String(retailVariant?.retail_price ?? 0));

  const lineItem = productToCartLineItem(product);
  const clientPrice = lineItem?.price ?? 0;

  const price = mounted ? clientPrice : retailPrice;
  const image = lineItem?.image;
  const category = lineItem?.category ?? "Uncategorized";

  const productHref = getProductPath({ id: product.id, slug: product.slug });

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lineItem) {
      toast.error("This product cannot be added to cart.");
      return;
    }
    addItem(lineItem);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="flex-shrink-0 w-[200px] border border-gray-200 rounded-lg bg-white p-3 flex flex-col">
      <Link href={productHref} className="block">
        <div className="h-32 bg-gray-50 rounded flex items-center justify-center mb-2 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-400 text-center px-2 line-clamp-2">
              {product.name}
            </span>
          )}
        </div>
      </Link>
      <p className="text-[10px] text-gray-500 line-clamp-1">{category}</p>
      <Link href={productHref}>
        <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mt-0.5 min-h-[2rem] hover:text-primary">
          {product.name}
        </h4>
      </Link>
      <div className="mt-2 flex items-center justify-between gap-1">
        <p className="text-sm font-bold text-primary">
          Rs. {price.toFixed(0)}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-0.5 text-[10px] bg-primary text-white px-2 py-1 rounded hover:opacity-90 shrink-0"
        >
          <ShoppingCart size={12} />
          Add
        </button>
      </div>
      <p className="text-[10px] text-primary mt-2">
        By <span className="font-medium">{lineItem?.seller ?? "Store"}</span>
      </p>
    </div>
  );
}
