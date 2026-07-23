"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "../cards/ProductCard";
import type { CartProductInput } from "@/src/types/cart";
import { getUserRole } from "@/src/lib/auth";
import { getActiveCurrency } from "@/src/lib/product-utils";

interface FeaturedProductsRowProps {
  products: CartProductInput[];
  title?: string;
}

export default function FeaturedProductsRow({
  products,
  title = "Featured Products",
}: FeaturedProductsRowProps) {
  const [role, setRole] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRole(getUserRole());
    setCurrency(getActiveCurrency());
    const onChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", onChange);
    return () => window.removeEventListener("currency_changed", onChange);
  }, []);

  if (!mounted) return null;

  const isWholesaler = role === "wholesaler" || role === "wholeseller";

  // Only show in-stock products
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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 mt-8 mb-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h2>
        <Link
          href="/products"
          className="text-xs md:text-sm font-bold text-[#ff4700] hover:underline flex items-center gap-0.5 transition-colors"
        >
          <span>View All</span>
          <span className="font-bold text-base">&gt;</span>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
        {visible.slice(0, 12).map((product) => (
          <div key={product.id} className="min-w-[180px] sm:min-w-[210px] flex-shrink-0">
            <ProductCard product={product} viewMode="grid" />
          </div>
        ))}
      </div>
    </div>
  );
}
