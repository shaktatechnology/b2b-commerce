"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Check, AlertCircle, Info, Ticket } from "lucide-react";
import { formatPrice } from "@/src/lib/product-utils";
import { validateCoupon } from "@/src/lib/coupons-api";
import { fetchCoupons } from "@/src/lib/storefront-api";
import { getAuthToken, getUserRole } from "@/src/lib/auth";
import { toast } from "sonner";

export interface VoucherDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartSubtotal: number;
  currency?: "NPR" | "USD";
  items?: any[];
  currentAppliedCode?: string | null;
  onSelectCoupon: (code: string, discountAmount: number) => void;
}

export default function VoucherDrawerModal({
  isOpen,
  onClose,
  cartSubtotal,
  currency = "NPR",
  items = [],
  currentAppliedCode,
  onSelectCoupon,
}: VoucherDrawerModalProps) {
  const router = useRouter();
  const [inputCode, setInputCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(
    currentAppliedCode || null,
  );
  const [selectedDiscount, setSelectedDiscount] = useState<number>(0);
  const [allCoupons, setAllCoupons] = useState<any[]>([]);
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [extraUnavailable, setExtraUnavailable] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTermsCoupon, setActiveTermsCoupon] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCode(currentAppliedCode || null);
      setUserRole(getUserRole());
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("collected_voucher_ids");
        if (stored) {
          try {
            setCollectedIds(JSON.parse(stored));
          } catch (e) {}
        }
      }
      // Fetch fresh coupons list from API
      setIsLoading(true);
      fetchCoupons()
        .then((res) => setAllCoupons(res || []))
        .catch(() => setAllCoupons([]))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentAppliedCode]);

  if (!isOpen) return null;

  const activeMarket = currency === "NPR" ? "NP" : "INT";

  // Process and group coupons into Available and Unavailable matching Screenshot 1
  const availableVouchers: any[] = [];
  const unavailableVouchers: any[] = [];

  const isWholesaler = userRole === "wholesaler" || userRole === "wholeseller";

  (allCoupons || []).forEach((coupon: any) => {
    // --- Role filter: skip entirely if coupon doesn't match user's customer type ---
    const custType = (coupon.customer_type || "all").toLowerCase();
    if (custType !== "all") {
      if (custType === "wholesale" && !isWholesaler) return;
      if (custType === "retail" && isWholesaler) return;
      if (custType !== "wholesale" && custType !== "retail") {
        // named role match
        if (!userRole || custType !== userRole.toLowerCase()) return;
      }
    }

    const regionRule = coupon.region_rules?.find(
      (r: any) => r.market === activeMarket && r.currency === currency,
    );

    // --- Market/Currency filter: skip entirely if coupon has no rule for the active market ---
    if (!regionRule) return;

    const isPercentage = regionRule.discount_type === "percentage";
    const discountVal = parseFloat(regionRule.discount_value || "0");
    const minSubtotal = parseFloat(regionRule.minimum_subtotal || "0");
    const maxDiscount = regionRule.maximum_discount
      ? parseFloat(regionRule.maximum_discount)
      : null;

    let calculatedDiscount = 0;
    if (isPercentage) {
      calculatedDiscount = (cartSubtotal * discountVal) / 100;
      if (maxDiscount && calculatedDiscount > maxDiscount) {
        calculatedDiscount = maxDiscount;
      }
    } else {
      calculatedDiscount = discountVal;
    }

    const codeUpper = (coupon.customer_code || "").toUpperCase();
    const forcedReason = extraUnavailable[codeUpper];

    // --- Backend-rejected coupons: hide entirely (first_order_only failures, auth errors, etc.) ---
    if (forcedReason) return;

    const isExpired =
      coupon.expires_at && new Date(coupon.expires_at) < new Date();
    const isUserLimitReached = Boolean(
      (coupon.usage_per_user &&
        coupon.user_redemptions_count &&
        coupon.user_redemptions_count >= coupon.usage_per_user) ||
      (coupon.usage_limit_per_user &&
        coupon.user_redemptions_count &&
        coupon.user_redemptions_count >= coupon.usage_limit_per_user),
    );
    const isGlobalLimitReached = Boolean(
      coupon.usage_limit &&
      coupon.redemptions_count &&
      coupon.redemptions_count >= coupon.usage_limit,
    );
    const isMinSpendMet = cartSubtotal >= minSubtotal;

    // --- Hard-skip conditions: these coupons cannot be used and are not useful to show ---
    // User-limit reached, global-limit reached, expired, first_order_only (can't verify client-side) → hide entirely
    if (
      isUserLimitReached ||
      isGlobalLimitReached ||
      isExpired ||
      coupon.first_order_only
    )
      return;

    let unavailabilityReason = "";
    if (!isMinSpendMet) {
      unavailabilityReason = `Min. spend ${formatPrice(minSubtotal, currency, 0)} not met (Cart: ${formatPrice(cartSubtotal, currency, 0)})`;
    } else if (coupon.status === "inactive") {
      unavailabilityReason = "This voucher is currently inactive.";
    }

    const isAvailable = isMinSpendMet && coupon.status !== "inactive";

    const processed = {
      ...coupon,
      regionRule,
      isPercentage,
      discountVal,
      minSubtotal,
      maxDiscount,
      calculatedDiscount,
      unavailabilityReason,
      isAvailable,
    };

    if (processed.isAvailable) {
      availableVouchers.push(processed);
    } else {
      unavailableVouchers.push(processed);
    }
  });

  const handleApplyCodeInput = async () => {
    if (!inputCode.trim()) return;

    const token = getAuthToken();
    if (!token) {
      toast.info("Please log in to validate and apply this coupon.");
      onClose();
      const redirectPath = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      router.push(`/login?redirect=${redirectPath}`);
      return;
    }

    const codeUpper = inputCode.trim().toUpperCase();

    setIsLoading(true);
    try {
      const res = await validateCoupon({
        code: codeUpper,
        subtotal: cartSubtotal,
        currency,
      });

      if (res.valid && res.data) {
        const discountAmt = parseFloat(res.data.discount_amount || "0");
        setSelectedCode(codeUpper);
        setSelectedDiscount(discountAmt);
        toast.success(`Coupon code ${codeUpper} applied!`);
      } else {
        const msg = res.message || "";
        const isAuthError =
          msg.toLowerCase().includes("authentication") ||
          msg.toLowerCase().includes("login");
        if (isAuthError) {
          toast.error("Please log in to validate and apply this coupon.");
          onClose();
          const redirectPath = encodeURIComponent(
            window.location.pathname + window.location.search,
          );
          router.push(`/login?redirect=${redirectPath}`);
          return;
        }

        // If coupon is not usable for limit/min spend or targeting, move/keep in unavailable vouchers
        const isLimitError =
          msg.toLowerCase().includes("limit") ||
          msg.toLowerCase().includes("redeem") ||
          msg.toLowerCase().includes("usage");
        const reasonText = isLimitError
          ? "Sorry, the voucher has already been fully redeemed."
          : msg || "Voucher is not applicable on selected items";

        setExtraUnavailable((prev) => ({ ...prev, [codeUpper]: reasonText }));
        toast.info(`Voucher ${codeUpper} is unavailable: ${reasonText}`);

        if (selectedCode === codeUpper) {
          setSelectedCode(null);
          setSelectedDiscount(0);
        }
      }
    } catch (e) {
      toast.error("Failed to validate coupon");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVoucher = (coupon: any) => {
    if (selectedCode === coupon.customer_code) {
      setSelectedCode(null);
      setSelectedDiscount(0);
    } else {
      setSelectedCode(coupon.customer_code);
      setSelectedDiscount(coupon.calculatedDiscount);
    }
  };

  const handleConfirm = async () => {
    if (selectedCode) {
      const token = getAuthToken();
      if (!token) {
        toast.info("Please log in to apply this voucher.");
        onClose();
        const redirectPath = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        router.push(`/login?redirect=${redirectPath}`);
        return;
      }

      setIsLoading(true);
      try {
        const res = await validateCoupon({
          code: selectedCode,
          subtotal: cartSubtotal,
          currency,
        });

        if (!res.valid) {
          const msg = res.message || "";
          const isAuthError =
            msg.toLowerCase().includes("authentication") ||
            msg.toLowerCase().includes("login");
          if (isAuthError) {
            toast.error("Please log in to apply this voucher.");
            onClose();
            const redirectPath = encodeURIComponent(
              window.location.pathname + window.location.search,
            );
            router.push(`/login?redirect=${redirectPath}`);
            return;
          } else {
            const isLimitError =
              msg.toLowerCase().includes("limit") ||
              msg.toLowerCase().includes("redeem") ||
              msg.toLowerCase().includes("usage");
            const reasonText = isLimitError
              ? "Sorry, the voucher has already been fully redeemed."
              : msg || "Voucher is not applicable on selected items";

            const codeUpper = selectedCode.toUpperCase();
            setExtraUnavailable((prev) => ({
              ...prev,
              [codeUpper]: reasonText,
            }));
            setSelectedCode(null);
            setSelectedDiscount(0);
            toast.info(`Voucher ${codeUpper} is unavailable: ${reasonText}`);
            return;
          }
        }

        const verifiedDiscount = parseFloat(
          res.data?.discount_amount || selectedDiscount,
        );
        onSelectCoupon(selectedCode, verifiedDiscount);
        toast.success(`Applied voucher ${selectedCode}`);
        onClose();
      } catch (e) {
        toast.error("Failed to validate coupon");
      } finally {
        setIsLoading(false);
      }
    } else {
      onSelectCoupon("", 0);
      onClose();
    }
  };

  return (
    <>
      {/* Main Checkout Voucher Drawer Modal matching Screenshot 1 */}
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
          {/* Top Bar Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
            <h2 className="text-lg font-extrabold text-gray-900 mx-auto pl-6">
              Voucher
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto space-y-5 flex-1">
            {/* Input Code Row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter Store/Daraz Code"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#ff4700] transition-colors"
              />
              <button
                type="button"
                onClick={handleApplyCodeInput}
                disabled={isLoading || !inputCode.trim()}
                className="bg-[#ff4700] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Section 1: Store Vouchers / Available Vouchers */}
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 mb-3">
                Store Voucher
              </h3>

              {availableVouchers.length > 0 ? (
                <div className="space-y-3">
                  {availableVouchers.map((coupon) => {
                    const isSelected = selectedCode === coupon.customer_code;
                    const isExpanded = activeTermsCoupon?.id === coupon.id;
                    return (
                      <div key={coupon.id}>
                        {/* Voucher Card */}
                        <div
                          onClick={() =>
                            setActiveTermsCoupon(isExpanded ? null : coupon)
                          }
                          className={`relative flex items-center bg-[#fff8f6] border rounded-2xl p-3 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#ff0055] ring-1 ring-[#ff0055]"
                              : isExpanded
                              ? "border-pink-300 rounded-b-none"
                              : "border-pink-100 hover:border-pink-300"
                          }`}
                        >
                          {/* Tag */}
                          <span className="absolute top-0 left-0 bg-[#ff385c] text-white text-[8px] font-black px-2 py-0.5 rounded-br-lg uppercase">
                            Voucher Max
                          </span>

                          {/* Left Discount info */}
                          <div className="w-[115px] shrink-0 pt-2 pr-2 border-r border-dashed border-pink-200 flex flex-col justify-center">
                            <span className="text-lg font-black text-[#ff0055] leading-none">
                              {coupon.isPercentage
                                ? `${Math.round(coupon.discountVal)}% OFF`
                                : formatPrice(coupon.discountVal, currency, 0)}
                            </span>
                            <span className="text-[9px] font-bold text-gray-500 mt-1">
                              Min. spend{" "}
                              {formatPrice(coupon.minSubtotal, currency, 0)}
                            </span>
                            {coupon.maxDiscount && (
                              <span className="text-[9px] font-semibold text-[#ff0055]/80">
                                Capped at{" "}
                                {formatPrice(coupon.maxDiscount, currency, 0)}
                              </span>
                            )}
                          </div>

                          {/* Middle Voucher details */}
                          <div className="flex-1 pl-3 pr-2 pt-1">
                            <span className="font-extrabold text-xs text-[#ff0055] line-clamp-1 block">
                              {coupon.name}
                            </span>
                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                              {coupon.description || "Applicable on store items"}
                            </p>
                            <span className="text-[9px] text-gray-400 font-medium block mt-1">
                              {coupon.expires_at
                                ? `${new Date(coupon.starts_at || coupon.created_at || Date.now()).toLocaleDateString()} – ${new Date(coupon.expires_at).toLocaleDateString()}`
                                : "Limited Period Offer"}
                            </span>
                          </div>

                          {/* Right Selection Checkbox — click only toggles selection */}
                          <div
                            className="shrink-0 pl-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectVoucher(coupon);
                            }}
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center border ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check size={14} className="stroke-[3]" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inline Detail Panel */}
                        {isExpanded && (
                          <div className="border border-t-0 border-pink-200 rounded-b-2xl bg-white px-4 py-4 space-y-3 text-xs text-gray-700">
                            {coupon.description && (
                              <div>
                                <p className="font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-1">Description</p>
                                <p className="font-medium text-gray-700">{coupon.description}</p>
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-1">Valid Period</p>
                              <p className="font-semibold text-gray-800">
                                {new Date(coupon.starts_at || coupon.created_at || Date.now()).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                                {" "}&rarr;{" "}
                                {coupon.expires_at
                                  ? new Date(coupon.expires_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
                                  : "No expiry"}
                              </p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-1">Voucher Code</p>
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                                <span className="font-mono font-black tracking-widest text-gray-800 flex-1">{coupon.customer_code}</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(coupon.customer_code); toast.success("Code copied!"); }}
                                  className="text-[#ff4700] text-[10px] font-bold hover:underline"
                                >Copy</button>
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-1">Targeting</p>
                              {coupon.categories?.length > 0 || coupon.products?.length > 0 ? (
                                <div className="space-y-1.5">
                                  {coupon.categories?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {coupon.categories.map((cat: any) => (
                                        <span key={cat.id} className="bg-pink-50 border border-pink-200 text-[#ff0055] text-[9px] font-bold px-2 py-0.5 rounded-full">{cat.name}</span>
                                      ))}
                                    </div>
                                  )}
                                  {coupon.products?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {coupon.products.map((p: any) => (
                                        <span key={p.id} className="bg-orange-50 border border-orange-200 text-[#ff4700] text-[9px] font-bold px-2 py-0.5 rounded-full">{p.name}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-400 italic">Applies to everything</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic bg-gray-50 rounded-xl p-3">
                  No available store vouchers for your cart total.
                </p>
              )}
            </div>

            {/* Section 2: Unavailable Vouchers matching Screenshot 1 */}
            {unavailableVouchers.length > 0 && (
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 mb-3">
                  Unavailable Voucher
                </h3>

                <div className="space-y-3">
                  {unavailableVouchers.map((coupon) => {
                    const isExpanded = activeTermsCoupon?.id === coupon.id;
                    return (
                      <div key={coupon.id}>
                        <div
                          onClick={() =>
                            setActiveTermsCoupon(isExpanded ? null : coupon)
                          }
                          className={`bg-gray-50/70 border border-gray-200 rounded-2xl overflow-hidden opacity-75 cursor-pointer hover:opacity-90 transition-opacity ${
                            isExpanded ? "rounded-b-none" : ""
                          }`}
                        >
                          <div className="flex items-center p-3">
                            {/* Left Column */}
                            <div className="w-[115px] shrink-0 pr-2 border-r border-dashed border-gray-300">
                              <span className="text-lg font-black text-gray-500 leading-none">
                                {coupon.isPercentage
                                  ? `${Math.round(coupon.discountVal)}% OFF`
                                  : formatPrice(coupon.discountVal, currency, 0)}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 block mt-1">
                                Min. spend{" "}
                                {formatPrice(coupon.minSubtotal, currency, 0)}
                              </span>
                              {coupon.maxDiscount && (
                                <span className="text-[9px] font-semibold text-gray-400 block">
                                  Capped at{" "}
                                  {formatPrice(coupon.maxDiscount, currency, 0)}
                                </span>
                              )}
                            </div>

                            {/* Middle Info */}
                            <div className="flex-1 pl-3 pr-2">
                              <span className="font-extrabold text-xs text-gray-600 line-clamp-1 block">
                                {coupon.name}
                              </span>
                              <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                                {coupon.description || "Upto discount offer"}
                              </p>
                              <span className="text-[9px] text-gray-400 block mt-1">
                                {coupon.expires_at
                                  ? `${new Date(coupon.starts_at || coupon.created_at || Date.now()).toLocaleDateString()} – ${new Date(coupon.expires_at).toLocaleDateString()}`
                                  : "Limited Period Offer"}
                              </span>
                            </div>

                            {/* Right Gray Box */}
                            <div className="shrink-0 pl-1">
                              <div className="w-5 h-5 rounded bg-gray-200 border border-gray-300" />
                            </div>
                          </div>

                          {/* Bottom Banner Alert Message */}
                          <div className="bg-gray-150/70 border-t border-gray-200 px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold">
                            <Info size={12} className="shrink-0 text-gray-400" />
                            <span>
                              {coupon.unavailabilityReason ||
                                "Voucher is not applicable on selected items"}
                            </span>
                          </div>
                        </div>

                        {/* Inline Detail Panel for unavailable */}
                        {isExpanded && (
                          <div className="border border-t-0 border-gray-200 rounded-b-2xl bg-gray-50 px-4 py-4 space-y-3 text-xs text-gray-600 opacity-90">
                            {coupon.description && (
                              <div>
                                <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-1">Description</p>
                                <p className="font-medium">{coupon.description}</p>
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-1">Valid Period</p>
                              <p className="font-semibold text-gray-700">
                                {new Date(coupon.starts_at || coupon.created_at || Date.now()).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                                {" "}&rarr;{" "}
                                {coupon.expires_at
                                  ? new Date(coupon.expires_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
                                  : "No expiry"}
                              </p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-1">Voucher Code</p>
                              <div className="flex items-center gap-2 bg-gray-200 rounded-lg px-3 py-1.5">
                                <span className="font-mono font-black tracking-widest text-gray-700 flex-1">{coupon.customer_code}</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider mb-1">Targeting</p>
                              {coupon.categories?.length > 0 || coupon.products?.length > 0 ? (
                                <div className="space-y-1.5">
                                  {coupon.categories?.map((cat: any) => (
                                    <span key={cat.id} className="inline-block bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded-full mr-1">{cat.name}</span>
                                  ))}
                                  {coupon.products?.map((p: any) => (
                                    <span key={p.id} className="inline-block bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded-full mr-1">{p.name}</span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-400 italic">Applies to everything</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Savings Calculation & Confirm Button matching Screenshot 1 */}
          <div className="bg-white border-t border-gray-100 p-4 space-y-3 sticky bottom-0 z-20">
            {selectedDiscount > 0 && (
              <div className="bg-pink-50 text-[#ff0055] font-extrabold text-center py-2 rounded-xl text-xs sm:text-sm">
                Saved {formatPrice(selectedDiscount, currency)}
              </div>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full bg-[#ff4700] hover:bg-[#e03e00] text-white font-extrabold py-3 rounded-xl text-sm sm:text-base shadow-md transition-all cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

    </>
  );
}
