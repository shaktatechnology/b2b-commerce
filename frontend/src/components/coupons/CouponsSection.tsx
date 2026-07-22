"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getActiveCurrency } from "@/src/lib/product-utils";
import { getUserRole } from "@/src/lib/auth";
import CouponVoucher from "./CouponVoucher";

interface CouponsSectionProps {
  coupons: any[];
  title?: string;
  showMoreLink?: boolean;
}

export default function CouponsSection({
  coupons,
  title = "Claim Vouchers ot Save More  ",
  showMoreLink = true,
}: CouponsSectionProps) {
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getUserRole());
    setCurrency(getActiveCurrency());
    
    const handleCurrencyChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", handleCurrencyChange);
    return () =>
      window.removeEventListener("currency_changed", handleCurrencyChange);
  }, []);

  // Filter coupons dynamically based on client-side currency and role
  const filteredCoupons = (coupons || []).filter((coupon: any) => {
    // 1. Filter by Region (Market/Currency)
    const activeMarket = currency === "NPR" ? "NP" : "INT";
    const hasRegionRule = coupon.region_rules?.some(
      (rule: any) => rule.market === activeMarket && rule.currency === currency
    );
    if (!hasRegionRule) return false;

    // 2. Filter by Customer Type (Role)
    const custType = (coupon.customer_type || "all").toLowerCase();
    if (custType === "all") return true;

    const isWholesaler = role === "wholesaler" || role === "wholeseller";
    if (custType === "wholesale") return isWholesaler;
    if (custType === "retail") return !isWholesaler;

    return role ? custType === String(role).toLowerCase() : false;
  });

  if (filteredCoupons.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 mt-8 mb-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-baseline mb-4">
        <h2 className="text-xl text-primary font-bold">{title}</h2>
        {showMoreLink && (
          <Link
            href="/vouchers"
            className="text-xs md:text-sm font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            More Vouchers &gt;
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
        {filteredCoupons.map((coupon) => (
          <CouponVoucher
            key={coupon.id}
            coupon={coupon}
            currencyPreference={currency}
            userRole={role}
          />
        ))}
      </div>
    </div>
  );
}
