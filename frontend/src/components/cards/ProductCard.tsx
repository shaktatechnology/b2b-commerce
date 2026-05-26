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
  id: string | number;
  name: string;
  slug: string;
  categories?: { id: string | number; name: string }[];
  variants?: { id: string | number; retail_price: string | number }[];
  image_url?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  images?: { url?: string; image_path?: string; image?: string }[];
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const variant = product.variants?.[0];
  const price = parseFloat(String(variant?.retail_price || "0"));

  const resolveImageUrl = () => {
    const raw = product.image_url || product.image || product.thumbnail || product.images?.[0]?.url || product.images?.[0]?.image_path || product.images?.[0]?.image;
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000";
    if (raw.startsWith("/storage/")) return `${storageUrl}${raw}`;
    if (raw.startsWith("storage/")) return `${storageUrl}/${raw}`;
    if (raw.startsWith("/")) return `${storageUrl}${raw}`;
    return `${storageUrl}/storage/${raw}`;
  };

  const image = resolveImageUrl();
  const category = product.categories?.[0]?.name || "Uncategorized";

  return (
    <div className="border rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden group">
      <Link href={`/products/${product.slug}`} className="block">
        {/* image */}
        <div className="h-48 bg-gray-50 flex items-center justify-center relative overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="text-center p-4">
              <p className="text-primary font-semibold text-sm line-clamp-2">
                {product.name}
              </p>
            </div>
          )}
        </div>

        {/* content */}
        <div className="p-3">
          {/* category */}
          <p className="text-[10px] uppercase font-black tracking-widest text-[#966FD6] mb-1">{category}</p>

          {/* title */}
          <h3 className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[40px]">
            {product.name}
          </h3>

          {/* price */}
          <p className="mt-2 text-primary font-black text-lg">
            Rs.{price.toFixed(0)}/-
          </p>
        </div>
      </Link>

      <div className="px-3 pb-3">
        {/* footer */}
        <div className="mt-1 flex items-center justify-between border-t border-zinc-100 pt-3">
          <p className="text-[10px] font-black uppercase text-zinc-400">
            By <span className="text-primary">Store</span>
          </p>

          <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-primary text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
            <ShoppingCart size={12} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
