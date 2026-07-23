"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Ticket, Truck, Tag, Percent } from "lucide-react";
import { getActiveCurrency, formatPrice } from "@/src/lib/product-utils";
import { getUserRole } from "@/src/lib/auth";
import { toast } from "sonner";
import CouponVoucher, { VoucherItemData } from "./CouponVoucher";

interface VoucherCenterClientProps {
  initialCoupons?: any[];
}

export default function VoucherCenterClient({
  initialCoupons = [],
}: VoucherCenterClientProps) {
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [role, setRole] = useState<string | null>(null);
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [showMoreMega, setShowMoreMega] = useState(false);

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

  const handleCollect = (id: string, code?: string) => {
    if (collectedIds.includes(id)) return;
    const updated = [...collectedIds, id];
    setCollectedIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("collected_voucher_ids", JSON.stringify(updated));
      if (code) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
    }
    toast.success("Voucher collected successfully! Applied at checkout.");
  };

  const handleCollectSection = (vouchers: VoucherItemData[]) => {
    const newIds = vouchers
      .filter((v) => !v.isRanOut)
      .map((v) => v.id);
    const combined = Array.from(new Set([...collectedIds, ...newIds]));
    setCollectedIds(combined);
    if (typeof window !== "undefined") {
      localStorage.setItem("collected_voucher_ids", JSON.stringify(combined));
    }
    toast.success("All vouchers in section collected!");
  };

  // Convert ALL backend API coupons dynamically
  const activeMarket = currency === "NPR" ? "NP" : "INT";

  const filteredApiCoupons = (initialCoupons || []).filter((coupon: any) => {
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

  const convertedVouchers: VoucherItemData[] = filteredApiCoupons.map((c: any) => {
    const regionRule = c.region_rules?.find(
      (rule: any) => rule.market === activeMarket && rule.currency === currency
    ) || c.region_rules?.[0];

    const isPercentage = regionRule?.discount_type === "percentage";
    const discountVal = parseFloat(regionRule?.discount_value || "0");
    const minSubtotal = parseFloat(regionRule?.minimum_subtotal || "0");
    const isFreeShipping = Boolean(regionRule?.free_shipping || c.name?.toLowerCase().includes("shipping"));
    const isPaymentSpecific = c.promotion_type === "payment_specific" || c.name?.toLowerCase().includes("esewa");

    const discountDisplay = isPercentage
      ? `${Math.round(discountVal)}% OFF`
      : formatPrice(discountVal, currency, 0);

    const validDates = c.expires_at
      ? `${new Date(c.starts_at || c.created_at || Date.now()).toLocaleDateString()}-${new Date(c.expires_at).toLocaleDateString()}`
      : "Limited Time Offer";

    return {
      id: c.id,
      name: c.name,
      code: c.customer_code,
      discountDisplay,
      subtitle: c.description || (isFreeShipping ? "Free Delivery Voucher" : "Platform Wide Store Voucher"),
      minSpend: minSubtotal > 0 ? `Min. Spend ${formatPrice(minSubtotal, currency, 0)}` : " ",
      validDates,
      theme: isFreeShipping ? "teal" : (isPaymentSpecific ? "gray" : "pink"),
      tag: isFreeShipping ? "" : (isPaymentSpecific ? "Limited Redemption" : "Voucher Max"),
      badge: isFreeShipping && c.name?.includes("x2") ? "x2" : undefined,
      isRanOut: c.status === "inactive" || (c.usage_limit && (c.redemptions_count >= c.usage_limit)),
      progressPercent: isPaymentSpecific ? 100 : undefined,
      terms: [
        `Applicable Market: ${currency === "NPR" ? "Nepal (NPR)" : "International (USD)"}`,
        minSubtotal > 0 ? `Minimum order subtotal: ${formatPrice(minSubtotal, currency, 0)}` : "No minimum subtotal required.",
        c.customer_type ? `Applicable Customer Tier: ${c.customer_type}` : "Applicable to all customer tiers.",
        "One voucher per order. Non-transferrable.",
      ],
    };
  });

  // Categorize dynamic vouchers dynamically
  const paymentVouchers = convertedVouchers.filter((v) => v.theme === "gray");
  const freeShippingVouchers = convertedVouchers.filter((v) => v.theme === "teal");
  const megaVouchers = convertedVouchers.filter((v) => v.theme === "pink");
  const topSavingVouchers = [...megaVouchers].sort((a, b) => b.name.localeCompare(a.name));

  const visibleMegaVouchers = showMoreMega
    ? megaVouchers
    : megaVouchers.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20 select-none">
      {/* Top Header Bar matching Image 2 */}
      <div className="bg-gradient-to-r from-[#ff5500] via-[#ff4400] to-[#ff6600] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold text-lg sm:text-xl hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
            <span>Voucher Center</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Ticket size={18} className="text-white" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {convertedVouchers.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-3xl p-12 text-center bg-white shadow-sm max-w-md mx-auto my-8">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 text-[#ff5500]">
              <Tag size={28} />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg">No Vouchers Found</h3>
            <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
              No active vouchers are currently available for region {currency}.
            </p>
          </div>
        ) : (
          <>
            {/* Section 1: Payment Partner Vouchers */}
            {paymentVouchers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">
                    Payment Partner Vouchers
                  </h2>
                  <span className="bg-[#ff4400] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    7.7 Maha Bachat
                  </span>
                </div>
                <div className="space-y-3">
                  {paymentVouchers.map((v) => (
                    <CouponVoucher
                      key={v.id}
                      voucherData={v}
                      isCollected={collectedIds.includes(v.id)}
                      onCollect={handleCollect}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Mega Saving Vouchers */}
            {megaVouchers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-pink-100 text-[#ff0055] flex items-center justify-center">
                      <Percent size={14} className="stroke-[2.5]" />
                    </span>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">
                      Mega Saving Coupons
                    </h2>
                  </div>
                  {/* <button
                    type="button"
                    onClick={() => handleCollectSection(megaVouchers)}
                    className="border border-[#ff0055] text-[#ff0055] hover:bg-pink-50 text-xs font-bold px-3 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Collect all
                  </button> */}
                </div>
                <p className="text-xs text-gray-500 font-semibold mb-3">
                  Platform Wide Store Vouchers
                </p>

                <div className="space-y-3">
                  {visibleMegaVouchers.map((v) => (
                    <CouponVoucher
                      key={v.id}
                      voucherData={v}
                      isCollected={collectedIds.includes(v.id)}
                      onCollect={handleCollect}
                    />
                  ))}
                </div>

                {megaVouchers.length > 4 && (
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={() => setShowMoreMega(!showMoreMega)}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-gray-500 hover:text-gray-800 transition-colors py-1 cursor-pointer"
                    >
                      <span>{showMoreMega ? "View less" : "View more"}</span>
                      {showMoreMega ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Section 3: Free shipping vouchers */}
            {freeShippingVouchers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-[#00bba6] flex items-center justify-center">
                      <Truck size={14} className="stroke-[2.5]" />
                    </span>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">
                      Free shipping vouchers
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCollectSection(freeShippingVouchers)}
                    className="border border-[#00bba6] text-[#00bba6] hover:bg-teal-50 text-xs font-bold px-3 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Collect all
                  </button>
                </div>

                <div className="space-y-3">
                  {freeShippingVouchers.map((v) => (
                    <CouponVoucher
                      key={v.id}
                      voucherData={v}
                      isCollected={collectedIds.includes(v.id)}
                      onCollect={handleCollect}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Top Saving Vouchers */}
            {topSavingVouchers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-[#ff0055] flex items-center justify-center">
                    <Tag size={14} className="stroke-[2.5]" />
                  </span>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">
                    Top Saving Vouchers
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topSavingVouchers.slice(0, 4).map((v) => (
                    <CouponVoucher
                      key={v.id}
                      voucherData={v}
                      isCollected={collectedIds.includes(v.id)}
                      onCollect={handleCollect}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


