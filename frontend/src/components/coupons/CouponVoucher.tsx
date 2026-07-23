"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Info, X } from "lucide-react";
import { formatPrice } from "@/src/lib/product-utils";
import { getAuthToken } from "@/src/lib/auth";
import { toast } from "sonner";

export interface VoucherItemData {
  id: string;
  name: string;
  code?: string;
  discountDisplay: string;
  subtitle?: string;
  minSpend?: string;
  validDates?: string;
  theme?: "pink" | "teal" | "gray";
  tag?: string;
  badge?: string;
  isRanOut?: boolean;
  progressPercent?: number;
  brandLogo?: string;
  terms?: string[];
  customer_code?: string;
}

interface CouponVoucherProps {
  coupon?: any;
  voucherData?: VoucherItemData;
  currencyPreference?: "NPR" | "USD";
  userRole?: string | null;
  isCollected?: boolean;
  onCollect?: (id: string, code?: string) => void;
}

export default function CouponVoucher({
  coupon,
  voucherData,
  currencyPreference = "NPR",
  isCollected = false,
  onCollect,
}: CouponVoucherProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // If coupon object passed from backend, normalize into voucherData structure
  let item: VoucherItemData;

  if (voucherData) {
    item = voucherData;
  } else if (coupon) {
    const regionRule = coupon.region_rules?.find(
      (rule: any) => rule.currency === currencyPreference
    ) || coupon.region_rules?.[0];

    const isPercentage = regionRule?.discount_type === "percentage";
    const discountVal = parseFloat(regionRule?.discount_value || "0");
    const minSubtotal = parseFloat(regionRule?.minimum_subtotal || "0");

    const discountStr = isPercentage
      ? `${Math.round(discountVal)}% OFF`
      : formatPrice(discountVal, currencyPreference, 0);

    const isFreeShipping = coupon.name?.toLowerCase().includes("shipping");

    item = {
      id: coupon.id || String(Math.random()),
      name: coupon.name || "Special Voucher",
      code: coupon.customer_code,
      discountDisplay: discountStr,
      subtitle: coupon.description || "Applicable on eligible store items",
      minSpend: minSubtotal > 0 ? `Min. Spend ${formatPrice(minSubtotal, currencyPreference, 0)}` : " ",
      validDates: coupon.expires_at ? `Valid till ${new Date(coupon.expires_at).toLocaleDateString()}` : "Limited Time Offer",
      theme: isFreeShipping ? "teal" : "pink",
      tag: isFreeShipping ? "" : "Voucher Max",
      terms: [
        `Valid currency: ${currencyPreference}`,
        minSubtotal > 0 ? `Minimum order subtotal: ${formatPrice(minSubtotal, currencyPreference, 0)}` : "No minimum subtotal required.",
        coupon.customer_type ? `Applicable to: ${coupon.customer_type} tier` : "Applicable to all customers.",
        "One use per order. Non-transferrable.",
      ],
      customer_code: coupon.customer_code,
    };
  } else {
    return null;
  }

  const isTeal = item.theme === "teal";
  const isGray = item.theme === "gray";
  const isPink = !isTeal && !isGray;

  const handleCollectClick = async () => {
    if (item.isRanOut) return;

    const token = getAuthToken();
    if (!token) {
      toast.info("Please log in to collect and save vouchers.");
      const redirectPath = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?redirect=${redirectPath}`);
      return;
    }

    if (onCollect) {
      onCollect(item.id, item.code || item.customer_code);
    } else if (item.code || item.customer_code) {
      try {
        await navigator.clipboard.writeText(item.code || item.customer_code || "");
        setCopied(true);
        toast.success(`Coupon ${item.code || item.customer_code} collected & copied!`);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.success("Voucher collected!");
      }
    } else {
      toast.success("Voucher collected!");
    }
  };

  return (
    <>
      <div className="relative flex bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden w-full select-none group min-h-[110px]">
        {/* Ticket Side Cutouts */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 rounded-full bg-gray-50/90 border border-gray-200 z-20" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-2.5 w-5 h-5 rounded-full bg-gray-50/90 border border-gray-200 z-20" />

        {/* Optional Tag Badge at top-left */}
        {item.tag && (
          <div className="absolute top-0 left-0 bg-[#ff385c] text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg z-10 uppercase tracking-tight shadow-sm">
            {item.tag}
          </div>
        )}

        {/* Optional Right Badge (e.g. x2 badge) */}
        {item.badge && (
          <div className="absolute top-2 right-3 bg-[#00bba6] text-white text-[9px] font-black px-1.5 py-0.5 rounded z-10">
            {item.badge}
          </div>
        )}

        {/* Left Section: Value & Min Spend */}
        <div className="w-[125px] sm:w-[135px] shrink-0 p-3 pl-4 flex flex-col justify-center items-start border-r border-dashed border-gray-200 relative bg-white">
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight leading-none ${
              isPink
                ? "text-[#ff0055]"
                : isTeal
                ? "text-[#00bba6]"
                : "text-gray-800"
            } ${item.tag ? "mt-3" : ""}`}
          >
            {item.discountDisplay}
          </div>

          {item.minSpend && (
            <div className="text-[10px] text-gray-500 font-semibold mt-1 line-clamp-1">
              {item.minSpend}
            </div>
          )}

          {/* Used Progress Bar for Esewa style */}
          {item.progressPercent !== undefined && (
            <div className="w-full mt-2">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gray-400 h-1.5 rounded-full"
                  style={{ width: `${item.progressPercent}%` }}
                />
              </div>
              <span className="text-[8px] text-gray-400 font-bold block mt-0.5">
                {item.progressPercent}% used
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Details, Dates, T&C & Button */}
        <div className="flex-1 flex flex-col justify-between p-3 pr-4 sm:pr-5 bg-white relative">
          {/* Top Row: Title & T&C */}
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm line-clamp-1">
                {item.name}
              </h4>
              {item.subtitle && (
                <p className="text-gray-400 text-[10px] sm:text-[11px] line-clamp-1 mt-0.5">
                  {item.subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-[10px] text-gray-400 hover:text-gray-600 font-semibold underline shrink-0 cursor-pointer"
            >
              T&C
            </button>
          </div>

          {/* Bottom Row: Valid dates & Action Button */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-50">
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">
              {item.validDates}
            </span>

            {/* Action Button or RAN OUT stamp */}
            {item.isRanOut ? (
              <div className="relative border-2 border-gray-300 text-gray-400 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider -rotate-12 select-none opacity-80">
                RAN OUT
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCollectClick}
                className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-sm cursor-pointer ${
                  isCollected
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : isPink
                    ? "bg-[#ff0055] hover:bg-[#e0004a] text-white"
                    : isTeal
                    ? "bg-[#00bba6] hover:bg-[#009b8a] text-white"
                    : "bg-gray-800 hover:bg-black text-white"
                }`}
              >
                {isCollected ? (
                  <span className="flex items-center gap-1">
                    <Check size={12} className="stroke-[3]" /> Collected
                  </span>
                ) : (
                  <span>Collect{item.badge ? ` ${item.badge}` : ""}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={18} />
            </button>
            <h3 className="font-extrabold text-gray-900 text-base mb-1">
              Terms & Conditions
            </h3>
            <p className="text-xs font-semibold text-primary mb-3">
              {item.name} ({item.discountDisplay})
            </p>

            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-2 mb-4">
              {item.terms && item.terms.length > 0 ? (
                item.terms.map((t, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="text-primary font-bold">•</span>
                    <span>{t}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex gap-2 items-start">
                    <span className="text-primary font-bold">•</span>
                    <span>Applicable on qualifying checkout orders.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-primary font-bold">•</span>
                    <span>Valid until expiration date. Limited stock available.</span>
                  </div>
                </>
              )}
            </div>

            {item.code && (
              <div className="bg-gray-100 rounded-xl p-2.5 flex justify-between items-center text-xs font-mono text-gray-800 mb-4">
                <span>Code: <strong>{item.code}</strong></span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.code || "");
                    toast.success("Code copied to clipboard!");
                  }}
                  className="text-primary hover:underline font-sans font-bold text-[11px]"
                >
                  Copy
                </button>
              </div>
            )}

            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full bg-primary text-white py-2 rounded-xl text-xs font-extrabold hover:brightness-110"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

