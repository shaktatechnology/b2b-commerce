"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  retail_price: string;
}

interface Product {
  id: string;
  name: string;
  categories: Category[];
  variants: Variant[];
  images: { url: string }[];
}

interface ProductCardProps {
  product: CartProductInput;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const variant = product.variants?.[0];
  const price = parseFloat(variant?.retail_price || "0");

  const rawImage = product.images?.[0]?.url;

  const image = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${BACKEND_URL}${rawImage}`
    : null;

  const category = product.categories?.[0]?.name || "Uncategorized";

  return (
    <div className="border rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      {/* image */}
      <div className="h-48 bg-gray-50 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center">
            <p className="text-primary font-semibold text-sm">
              {product.name}
            </p>
          </div>
        )}
      </div>

      {/* content */}
      <div className="p-3">
        {/* category */}
        <p className="text-xs text-gray-500 mb-1">{category}</p>

        {/* title */}
        <h3 className="text-sm font-semibold line-clamp-1">
          {product.name}
        </h3>

        {/* price */}
        <p className="mt-2 text-primary font-bold text-base">
          Rs.{price.toFixed(0)}/-
        </p>

        {/* footer */}
        <div className="mt-3 flex items-center justify-between border-t border-primary/20 pt-2">
          <p className="text-xs text-gray-400">
            By <span className="text-primary">Store</span>
          </p>

          <button className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1 rounded-full hover:opacity-90">
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
