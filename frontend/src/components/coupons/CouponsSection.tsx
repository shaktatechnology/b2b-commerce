"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getActiveCurrency } from "@/src/lib/product-utils";
import CouponVoucher from "./CouponVoucher";

interface CouponsSectionProps {
  coupons: any[];
  title?: string;
  showMoreLink?: boolean;
}

export default function CouponsSection({
  coupons,
  title = "Exclusive Coupons",
  showMoreLink = true,
}: CouponsSectionProps) {
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");

  useEffect(() => {
    setCurrency(getActiveCurrency());
    const handleCurrencyChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", handleCurrencyChange);
    return () =>
      window.removeEventListener("currency_changed", handleCurrencyChange);
  }, []);

  if (!coupons || coupons.length === 0) return null;

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
        {coupons.map((coupon) => (
          <CouponVoucher
            key={coupon.id}
            coupon={coupon}
            currencyPreference={currency}
          />
        ))}
      </div>
    </div>
  );
}
