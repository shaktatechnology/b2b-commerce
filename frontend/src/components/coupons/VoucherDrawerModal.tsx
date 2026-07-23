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
                    return (
                      <div
                        key={coupon.id}
                        onClick={() => handleSelectVoucher(coupon)}
                        className={`relative flex items-center bg-[#fff8f6] border rounded-2xl p-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#ff0055] ring-1 ring-[#ff0055]"
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
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-xs text-[#ff0055] line-clamp-1">
                              {coupon.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTermsCoupon(coupon);
                              }}
                              className="text-[9px] text-[#ff0055] bg-pink-100 hover:bg-pink-200 font-bold px-1.5 py-0.5 rounded ml-1"
                            >
                              T&C
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                            {coupon.description || "Applicable on store items"}
                          </p>
                          <span className="text-[9px] text-gray-400 font-medium block mt-1">
                            {coupon.expires_at
                              ? `${new Date(coupon.starts_at || coupon.created_at || Date.now()).toLocaleDateString()}-${new Date(coupon.expires_at).toLocaleDateString()}`
                              : "Limited Period Offer"}
                          </span>
                        </div>

                        {/* Right Selection Checkbox */}
                        <div className="shrink-0 pl-1">
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
                  {unavailableVouchers.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="bg-gray-50/70 border border-gray-200 rounded-2xl overflow-hidden opacity-75 select-none"
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
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-xs text-gray-600 line-clamp-1">
                              {coupon.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTermsCoupon(coupon)}
                              className="text-[9px] text-gray-400 bg-gray-200 font-bold px-1.5 py-0.5 rounded"
                            >
                              T&C
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                            {coupon.description || "Upto discount offer"}
                          </p>
                          <span className="text-[9px] text-gray-400 block mt-1">
                            {coupon.expires_at
                              ? `${new Date(coupon.starts_at || coupon.created_at || Date.now()).toLocaleDateString()}-${new Date(coupon.expires_at).toLocaleDateString()}`
                              : "Limited Period Offer"}
                          </span>
                        </div>

                        {/* Right Gray Box */}
                        <div className="shrink-0 pl-1">
                          <div className="w-5 h-5 rounded bg-gray-200 border border-gray-300" />
                        </div>
                      </div>

                      {/* Bottom Banner Alert Message matching Screenshot 1 */}
                      <div className="bg-gray-150/70 border-t border-gray-200 px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold">
                        <Info size={12} className="shrink-0 text-gray-400" />
                        <span>
                          {coupon.unavailabilityReason ||
                            "Voucher is not applicable on selected items"}
                        </span>
                      </div>
                    </div>
                  ))}
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

      {/* Terms & Conditions Modal matching Screenshot 2 */}
      {activeTermsCoupon && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Terms Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-base font-extrabold text-gray-900 mx-auto pl-6">
                Terms and Condition
              </h2>
              <button
                onClick={() => setActiveTermsCoupon(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Terms Content Body matching Screenshot 2 */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700 leading-relaxed flex-1">
              {/* Cap Section */}
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm mb-1 underline decoration-pink-300 decoration-2">
                  Cap
                </h4>
                <p className="font-semibold text-gray-700">
                  The voucher is capped at{" "}
                  <strong className="text-[#ff0055]">
                    {activeTermsCoupon.maxDiscount
                      ? formatPrice(activeTermsCoupon.maxDiscount, currency)
                      : activeTermsCoupon.discountVal
                        ? formatPrice(activeTermsCoupon.discountVal, currency)
                        : "store discount limits"}
                  </strong>
                </p>
              </div>

              {/* General Section */}
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm mb-1.5 underline decoration-pink-300 decoration-2">
                  General
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-gray-600 font-medium">
                  <li>
                    Voucher collected will be applied automatically on your
                    checkout cart.
                  </li>
                  <li>
                    Voucher is applicable on store products and eligible orders.
                  </li>
                  <li>
                    {activeTermsCoupon.categories?.length > 0 ||
                    activeTermsCoupon.products?.length > 0
                      ? "Voucher is applicable on targeted selected categories/items specified at collection."
                      : "Targeting: Applies to all store products (no specific restriction)."}
                  </li>
                  <li>
                    Voucher cannot be combined with conflicting promotional
                    discounts.
                  </li>
                  <li>
                    The use of the Voucher is subject to the Vouchers Terms and
                    Conditions.
                  </li>
                </ol>
              </div>

              {/* Usage Period Section */}
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm mb-1 underline decoration-pink-300 decoration-2">
                  Usage Period
                </h4>
                <p className="font-medium text-gray-700">
                  The voucher is valid from{" "}
                  <strong>
                    {new Date(
                      activeTermsCoupon.starts_at ||
                        activeTermsCoupon.created_at ||
                        Date.now(),
                    ).toLocaleString()}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {activeTermsCoupon.expires_at
                      ? new Date(activeTermsCoupon.expires_at).toLocaleString()
                      : "end of promotion period"}
                  </strong>
                </p>
              </div>

              {/* Voucher Code Identification Section */}
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm mb-1 underline decoration-pink-300 decoration-2">
                  Voucher Identification Code
                </h4>
                <div className="bg-gray-100 rounded-xl p-2.5 font-mono text-xs font-bold text-gray-800 flex justify-between items-center">
                  <span>{activeTermsCoupon.customer_code}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        activeTermsCoupon.customer_code,
                      );
                      toast.success("Voucher code copied!");
                    }}
                    className="text-[#ff4700] hover:underline font-sans text-[11px] font-bold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setActiveTermsCoupon(null)}
                className="w-full bg-[#ff4700] hover:bg-[#e03e00] text-white font-extrabold py-3 rounded-xl text-sm shadow cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
