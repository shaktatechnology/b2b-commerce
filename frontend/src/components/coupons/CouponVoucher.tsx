"use client";

import { useState } from "react";
import { Tag, Check, Copy, Info } from "lucide-react";
import { formatPrice } from "@/src/lib/product-utils";
import { toast } from "sonner";

interface CouponVoucherProps {
  coupon: any;
  currencyPreference?: "NPR" | "USD";
  userRole?: string | null;
}

export default function CouponVoucher({
  coupon,
  currencyPreference = "NPR",
  userRole,
}: CouponVoucherProps) {
  const [copied, setCopied] = useState(false);

  // Find region rule matching the currency preference
  const regionRule = coupon.region_rules?.find(
    (rule: any) => rule.currency === currencyPreference
  ) || coupon.region_rules?.[0];

  if (!regionRule) return null;

  const isPercentage = regionRule.discount_type === "percentage";
  const discountVal = parseFloat(regionRule.discount_value);
  const minSpend = parseFloat(regionRule.minimum_subtotal);
  const maxDiscount = regionRule.maximum_discount
    ? parseFloat(regionRule.maximum_discount)
    : null;

  // Format display of discount value
  const discountDisplay = isPercentage
    ? `${Math.round(discountVal)}%`
    : formatPrice(discountVal, currencyPreference, 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.customer_code);
      setCopied(true);
      toast.success(`Coupon code ${coupon.customer_code} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code.");
    }
  };

  // Determine applicability description
  const hasProducts = coupon.products && coupon.products.length > 0;
  const hasCategories = coupon.categories && coupon.categories.length > 0;
  const hasBrands = coupon.brands && coupon.brands.length > 0;
  const isRestricted = hasProducts || hasCategories || hasBrands;


  return (
    <div className="relative flex bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden min-h-[120px] max-w-sm w-full select-none group">
      {/* Decorative Ticket Notches */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 rounded-full bg-gray-50 border-r border-gray-150 z-10" />
      <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 rounded-full bg-gray-50 border-l border-gray-150 z-10" />

      {/* Left section: Discount Banner */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-650 text-white w-[110px] shrink-0 p-3 pl-5 text-center relative">
        <div className="text-2xl font-black tracking-tight">{discountDisplay}</div>
        <div className="text-[10px] uppercase font-bold tracking-widest opacity-90 mt-0.5">
          {isPercentage ? "Off" : "Discount"}
        </div>
        {maxDiscount && (
          <div className="text-[8px] opacity-75 mt-1 font-medium">
            Max: {formatPrice(maxDiscount, currencyPreference, 0)}
          </div>
        )}
      </div>

      {/* Dashed vertical separator line */}
      <div className="border-l-2 border-dashed border-gray-200 h-10 align-self-center my-auto shrink-0 relative z-20" />

      {/* Right section: Info & Copy Button */}
      <div className="flex-1 flex flex-col justify-between p-4 pr-6 bg-white pl-4">
        <div>
          <div className="flex items-center gap-1.5">
            {coupon.customer_type?.toLowerCase() === "wholesale" && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium border border-emerald-100">
                Wholesalers Only
              </span>
            )}
            {isRestricted && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-100 flex items-center gap-0.5">
                <Info size={10} /> Selected Items
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-800 text-sm mt-1 line-clamp-1 group-hover:text-primary transition-colors">
            {coupon.name}
          </h3>
          <p className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">
            {coupon.description || "Get a discount on your purchase."}
          </p>
        </div>

        <div className="flex items-end justify-between mt-2 pt-2 border-t border-gray-50">
          <div className="text-[10px] text-gray-400 font-medium">
            {minSpend > 0 ? (
              <span>Min. Spend: {formatPrice(minSpend, currencyPreference, 0)}</span>
            ) : (
              <span>No Minimum Spend</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 bg-gray-50 hover:bg-primary hover:text-white border border-gray-200 hover:border-primary text-gray-700 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all duration-200"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-500 group-hover:text-white" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span className="font-mono">{coupon.customer_code}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
