"use client";

import { useState, useEffect } from "react";
import CouponsSection from "../coupons/CouponsSection";
import FeaturedProductsRow from "./FeaturedProductsRow";
import { getActiveCurrency } from "@/src/lib/product-utils";
import { getUserRole } from "@/src/lib/auth";
import type { CartProductInput } from "@/src/types/cart";

interface VouchersOrProductsProps {
  coupons: any[];
  products: CartProductInput[];
}

export default function VouchersOrProducts({ coupons, products }: VouchersOrProductsProps) {
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrency(getActiveCurrency());
    setRole(getUserRole());
    const onChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", onChange);
    return () => window.removeEventListener("currency_changed", onChange);
  }, []);

  // Determine if there are any coupons visible for the active market/currency
  const activeMarket = currency === "NPR" ? "NP" : "INT";
  const hasActiveCoupons = mounted && (coupons || []).some((coupon: any) => {
    const hasRegionRule = coupon.region_rules?.some(
      (rule: any) => rule.market === activeMarket && rule.currency === currency
    );
    if (!hasRegionRule) return false;
    const custType = (coupon.customer_type || "all").toLowerCase();
    if (custType === "all") return true;
    const isWholesaler = role === "wholesaler" || role === "wholeseller";
    if (custType === "wholesale") return isWholesaler;
    if (custType === "retail") return !isWholesaler;
    return role ? custType === String(role).toLowerCase() : false;
  });

  return (
    <>
      {/* Vouchers section — renders null internally if nothing to show */}
      <CouponsSection coupons={coupons} />

      {/* Show featured products only when no vouchers are applicable */}
      {mounted && !hasActiveCoupons && (
        <FeaturedProductsRow products={products} title="Featured Products" />
      )}
    </>
  );
}
