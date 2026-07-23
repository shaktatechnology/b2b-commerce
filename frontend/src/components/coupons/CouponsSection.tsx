"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getActiveCurrency } from "@/src/lib/product-utils";
import { getUserRole } from "@/src/lib/auth";
import CouponVoucher from "./CouponVoucher";

interface CouponsSectionProps {
  coupons?: any[];
  title?: string;
  showMoreLink?: boolean;
}

export default function CouponsSection({
  coupons = [],
  title = "Claim Coupons to Save More",
  showMoreLink = true,
}: CouponsSectionProps) {
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [role, setRole] = useState<string | null>(null);
  const [collectedIds, setCollectedIds] = useState<string[]>([]);

  useEffect(() => {
    setRole(getUserRole());
    setCurrency(getActiveCurrency());

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("collected_voucher_ids");
      if (stored) {
        try {
          setCollectedIds(JSON.parse(stored));
        } catch (e) {}
      }
    }

    const handleCurrencyChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", handleCurrencyChange);
    return () =>
      window.removeEventListener("currency_changed", handleCurrencyChange);
  }, []);

  // Filter coupons dynamically based on client-side currency and role
  const activeMarket = currency === "NPR" ? "NP" : "INT";
  const filteredCoupons = (coupons || []).filter((coupon: any) => {
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

  if (!filteredCoupons || filteredCoupons.length === 0) {
    return null;
  }

  const handleCollect = (id: string, code?: string) => {
    if (!collectedIds.includes(id)) {
      const updated = [...collectedIds, id];
      setCollectedIds(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("collected_voucher_ids", JSON.stringify(updated));
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 mt-8 mb-4 animate-in fade-in duration-300 select-none">
      {/* Header Line */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h2>
        {showMoreLink && (
          <Link
            href="/vouchers"
            className="text-xs md:text-sm font-bold text-[#ff4700] hover:underline flex items-center gap-0.5 transition-colors"
          >
            <span>More Coupons</span>
            <span className="font-bold text-base">&gt;</span>
          </Link>
        )}
      </div>

      {/* Horizontal Scroll List of Coupon Cards with Collect Buttons */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
        {filteredCoupons.map((coupon) => (
          <div key={coupon.id} className="min-w-[300px] sm:min-w-[345px] flex-shrink-0">
            <CouponVoucher
              coupon={coupon}
              currencyPreference={currency}
              userRole={role}
              isCollected={collectedIds.includes(coupon.id)}
              onCollect={handleCollect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
