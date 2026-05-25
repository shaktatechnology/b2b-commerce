"use client";

import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import type { StorefrontProduct } from "@/src/types/storefront";
import RecommendedProductCard from "@/src/components/cart/RecommendedProductCard";
import type { CartProductInput } from "@/src/types/cart";

interface ProductCarouselSectionProps {
  title: string;
  products: StorefrontProduct[];
}

function toCartInput(product: StorefrontProduct): CartProductInput {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categories: product.categories,
    variants: product.variants,
    images: product.images,
  };
}

export default function ProductCarouselSection({
  title,
  products,
}: ProductCarouselSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl text-primary font-semibold mb-5">{title}</h2>
      <div className="relative">
        <div
          ref={ref}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2 pr-12"
        >
          {products.map((product) => (
            <RecommendedProductCard
              key={product.id}
              product={toCartInput(product)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => ref.current?.scrollBy({ left: 220, behavior: "smooth" })}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-gray-300 bg-white shadow flex items-center justify-center text-primary"
          aria-label={`Scroll ${title}`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
