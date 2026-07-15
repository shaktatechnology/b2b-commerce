"use client";

import { useState, useEffect } from "react";
import { Tag, Globe, Sparkles, UserCheck } from "lucide-react";
import { getActiveCurrency } from "@/src/lib/product-utils";
import { getUserRole } from "@/src/lib/auth";
import CouponVoucher from "./CouponVoucher";

interface VoucherCenterClientProps {
  initialCoupons: any[];
}

export default function VoucherCenterClient({
  initialCoupons,
}: VoucherCenterClientProps) {
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
  const filteredCoupons = (initialCoupons || []).filter((coupon: any) => {
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

    // Fallback direct role check
    return custType === String(role).toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 pb-20">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <Sparkles size={12} /> Storefront Voucher Center
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Claim Your Vouchers
        </h1>
        <p className="text-gray-500 text-sm md:text-base mt-2">
          Collect and copy coupons to save on your orders. Switch currency preferences in the header to view regional coupons.
        </p>
      </div>

      {/* Info Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-10 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm text-sm text-gray-600">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <Globe className="text-primary shrink-0" size={18} />
          <span>Active Market: <strong className="text-gray-800">{currency === "NPR" ? "Nepal (NPR)" : "International (USD)"}</strong></span>
        </div>
        <div className="flex items-center gap-2 justify-center sm:justify-start border-t sm:border-t-0 sm:border-l border-gray-150 pt-2 sm:pt-0 sm:pl-4">
          <UserCheck className="text-primary shrink-0" size={18} />
          <span>Customer Tier: <strong className="text-gray-800">{role === "wholesaler" ? "Wholesale (MOQ rules apply)" : "Retail"}</strong></span>
        </div>
      </div>

      {/* Coupons Grid */}
      {filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {filteredCoupons.map((coupon) => (
            <CouponVoucher
              key={coupon.id}
              coupon={coupon}
              currencyPreference={currency}
              userRole={role}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-3xl p-16 text-center max-w-md mx-auto bg-gray-50/50 mt-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Tag size={22} />
          </div>
          <h3 className="font-bold text-gray-800 text-base">No Vouchers Found</h3>
          <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
            There are currently no active vouchers matching your selected region ({currency}) and account level. Try toggling your currency preference in the website header!
          </p>
        </div>
      )}
    </div>
  );
}
