import React from "react";
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
  image?: string;
  thumbnail?: string;
  image_url?: string;
  images: { url?: string; image_path?: string }[];
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const variant = product.variants?.[0];
  const price = parseFloat(variant?.retail_price || "0");

  const getImageUrl = (p: Product): string => {
    const path = p.image || p.thumbnail || p.image_url || p.images?.[0]?.url || p.images?.[0]?.image_path || "";
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000";
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${storageUrl}${normalizedPath}`;
  };

  const image = getImageUrl(product);
  const category = product.categories?.[0]?.name || "Uncategorized";

  return (
    <div className="border rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      {/* image */}
      <div className="h-36 sm:h-48 bg-gray-50 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center px-2">
            <p className="text-primary font-semibold text-xs sm:text-sm">
              {product.name}
            </p>
          </div>
        )}
      </div>

      {/* content */}
      <div className="p-2 sm:p-3">
        {/* category */}
        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">{category}</p>

        {/* title */}
        <h3 className="text-xs sm:text-sm font-semibold line-clamp-1">
          {product.name}
        </h3>

        {/* price */}
        <p className="mt-1 sm:mt-2 text-primary font-bold text-sm sm:text-base">
          Rs.{price.toFixed(0)}/-
        </p>

        {/* footer */}
        <div className="mt-2 sm:mt-3 flex items-center justify-between border-t border-primary/20 pt-2">
          <p className="text-[10px] sm:text-xs text-gray-400">
            By <span className="text-primary">Store</span>
          </p>

          <button className="flex items-center gap-1 text-[10px] sm:text-xs bg-primary text-white px-2 sm:px-3 py-1 rounded-full hover:opacity-90">
            <ShoppingCart size={12} className="sm:hidden" />
            <ShoppingCart size={14} className="hidden sm:block" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;