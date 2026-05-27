"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/src/store/use-cart-store";
import {
  getProductPath,
  productToCartLineItem,
} from "@/src/lib/product-utils";
import type { CartProductInput } from "@/src/types/cart";

interface ProductCardProps {
  product: CartProductInput;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addItem = useCartStore((s) => s.addItem);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const retailVariant = product.variants?.[0];
  const retailPrice = parseFloat(String(retailVariant?.retail_price ?? 0));

  const lineItem = productToCartLineItem(product);
  const clientPrice = lineItem?.price ?? 0;

  const price = mounted ? clientPrice : retailPrice;
  const image = lineItem?.image;
  const category = lineItem?.category ?? "Uncategorized";
  const href = getProductPath({ id: product.id, slug: product.slug });

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
    <div className="border rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden h-full flex flex-col">
      <Link href={href} className="block">
        <div className="h-48 bg-gray-50 flex items-center justify-center">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-center px-2">
              <p className="text-primary font-semibold text-sm">{product.name}</p>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-500 mb-1">{category}</p>

        <Link href={href}>
          <h3 className="text-sm font-semibold line-clamp-2 hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <p className="mt-2 text-primary font-bold text-base">
          Rs.{price.toFixed(0)}/-
        </p>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-primary/20">
          <p className="text-xs text-gray-400">
            By <span className="text-primary">{product.brand?.name || "Store"}</span>
          </p>

          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1 rounded-full hover:opacity-90 cursor-pointer"
          >
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
