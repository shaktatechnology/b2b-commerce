"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/src/store/use-cart-store";
import { useAppStore } from "@/src/store/use-app-store";
import {
  formatRs,
  formatPrice,
  getActiveCurrency,
} from "@/src/lib/product-utils";
import { getAuthToken } from "@/src/lib/auth";
import { syncCartToServer, checkoutOrder } from "@/src/lib/cart-api";
import { initiatePayment } from "@/src/lib/payment-api";
import type {
  PaymentSettings,
  PaymentGatewayId,
} from "@/src/types/payment-settings";
import EsewaPaymentForm from "./EsewaPaymentForm";

interface CheckoutPageClientProps {
  paymentSettings: PaymentSettings;
}

type Step = "shipping" | "payment" | "redirecting";

export default function CheckoutPageClient({
  paymentSettings,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const discountTotal = useCartStore((s) => s.discountTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const markItemInactive = useCartStore((s) => s.markItemInactive);

  const [step, setStep] = useState<Step>("shipping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Stored copy of checked out items so they persist in the UI summary when local cart is cleared
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  // Set when the backend rejects an order because one cart item's variant
  // went inactive after it was added to cart (stale local is_active).
  // We can't reliably map the backend's message back to a specific
  // variantId (it only returns the variant name), so this drives a
  // persistent banner rather than an auto-removed line item.
  const [unavailableNotice, setUnavailableNotice] = useState<string | null>(null);

  const [orderSubtotal, setOrderSubtotal] = useState<number>(0);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [selectedGateway, setSelectedGateway] =
    useState<PaymentGatewayId | null>(paymentSettings.defaultGateway);
  const [esewaConfig, setEsewaConfig] = useState<{
    config: import("@/src/lib/payment-api").EsewaPaymentConfig;
    paymentId: string;
    amount: number;
  } | null>(null);

  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "Nepal",
    notes: "",
  });

  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrency(getActiveCurrency());
    const handleCurrencyChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", handleCurrencyChange);
    return () =>
      window.removeEventListener("currency_changed", handleCurrencyChange);
  }, []);


  const formatCheckoutPrice = (amount: number) => formatPrice(amount, currency);

  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(true);

  // All configured gateways are shown regardless of currency. eSewa only
  // works for NPR orders and PayPal only works for USD orders, so those two
  // are disabled (greyed out, unselectable) rather than removed when the
  // currency doesn't match. COD (and any other gateway) is always enabled.
  const isGatewayDisabledForCurrency = (gatewayId: string) => {
    if (gatewayId === "esewa") return currency !== "NPR";
    if (gatewayId === "paypal") return currency !== "USD";
    return false;
  };

  const activeGateways = paymentSettings.gateways;
  const enabledGateways = activeGateways.filter(
    (g) => !isGatewayDisabledForCurrency(g.id),
  );

  // Make sure we select a valid, currency-enabled default gateway whenever
  // the currency (or gateway list) changes.
  useEffect(() => {
    const validIds = enabledGateways.map((g) => g.id);
    if (
      validIds.length > 0 &&
      (!selectedGateway || !validIds.includes(selectedGateway))
    ) {
      if (
        paymentSettings.defaultGateway &&
        validIds.includes(paymentSettings.defaultGateway)
      ) {
        setSelectedGateway(paymentSettings.defaultGateway);
      } else {
        setSelectedGateway(validIds[0]);
      }
    }
  }, [
    currency,
    enabledGateways,
    selectedGateway,
    paymentSettings.defaultGateway,
  ]);

  useEffect(() => {
    // Clear any pending payment configs from previous sessions
    sessionStorage.removeItem("pending_payment_config");

    const storageKey = user
      ? `b2b_shipping_address_${user.id}`
      : "b2b_shipping_address";
    const savedAddress = localStorage.getItem(storageKey);
    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress);
        setForm((prev) => ({ ...prev, ...parsed }));

        // Sync currency preferences with loaded country
        if (parsed.country) {
          const nextCur =
            parsed.country.toLowerCase() === "nepal"
              ? getActiveCurrency()
              : "USD";
          localStorage.setItem("currency_preference", nextCur);
          useCartStore.getState().syncCurrency(nextCur);
          window.dispatchEvent(new Event("currency_changed"));
        }

        // Only skip editing if all key required address fields are present
        if (
          parsed.street?.trim() &&
          parsed.city?.trim() &&
          parsed.state?.trim() &&
          parsed.zip?.trim() &&
          parsed.country?.trim()
        ) {
          setIsEditingAddress(false);
        } else {
          setIsEditingAddress(true);
        }
      } catch (e) {
        console.error("Failed to parse saved address");
        setIsEditingAddress(true);
      }
    } else {
      setIsEditingAddress(true);
    }
  }, [user]);

  // Lock currency toggle in the Navbar when on the payment step
  const lockCurrency = useCallback(() => {
    sessionStorage.setItem("currency_locked", "true");
    window.dispatchEvent(new Event("currency_lock_changed"));
  }, []);

  const unlockCurrency = useCallback(() => {
    sessionStorage.removeItem("currency_locked");
    window.dispatchEvent(new Event("currency_lock_changed"));
  }, []);

  useEffect(() => {
    if (step === "payment" || step === "redirecting") {
      lockCurrency();
    } else {
      unlockCurrency();
    }
  }, [step, lockCurrency, unlockCurrency]);

  // Always unlock on unmount (e.g. user navigates away)
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("currency_locked");
      window.dispatchEvent(new Event("currency_lock_changed"));
    };
  }, []);

  const isNepalUsdMismatch = form.country.trim().toLowerCase() === "nepal" && currency !== "NPR";
  const isNonNepalNprMismatch = form.country.trim().toLowerCase() !== "nepal" && currency !== "USD";
  const isCurrencyAddressMismatch = isNepalUsdMismatch || isNonNepalNprMismatch;
  const total = subtotal();
  const activeDiscount =
    step === "shipping"
      ? discountTotal()
      : orderDiscount > 0
        ? orderDiscount
        : checkoutDiscount;

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Auto-set currency & translate cart items based on country selection.
    // This must run outside the setForm updater — updater functions must
    // stay pure (React can invoke them more than once), and calling a
    // different store's setState from inside one triggers "Cannot update a
    // component while rendering a different component".
    if (field === "country") {
      const nextCur =
        value.toLowerCase() === "nepal" ? getActiveCurrency() : "USD";
      localStorage.setItem("currency_preference", nextCur);
      useCartStore.getState().syncCurrency(nextCur);
      window.dispatchEvent(new Event("currency_changed"));
    }
  };

  const getImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const host = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
    ).replace("/api", "");
    return `${host}${url}`;
  };

  const handleCreateOrder = async () => {
    setUnavailableNotice(null);
    const token = getAuthToken();
    if (!token) {
      router.push("/login?redirect=/checkout");
      return;
    }

    const activeItems = step === "shipping" ? items : checkoutItems;
    if (activeItems.length === 0) {
      toast.error("Your cart is empty.");
      router.push("/cart");
      return;
    }

    for (const item of activeItems) {
      if (item.is_active === false) {
        toast.error(
          `Item "${item.name}" (${item.variantId ? "selected variant" : "product"}) is no longer available. Please remove it from your cart.`,
        );
        return;
      }
      if (item.stock !== undefined && item.stock <= 0) {
        toast.error(
          `Item "${item.name}" is out of stock and cannot be checked out.`,
        );
        return;
      }
      if (item.stock !== undefined && item.quantity > item.stock) {
        toast.error(
          `Item "${item.name}" only has ${item.stock} unit${item.stock === 1 ? "" : "s"} available.`,
        );
        return;
      }
    }

    if (!form.street.trim()) {
      toast.error("Street address is required.");
      setIsEditingAddress(true);
      return;
    }
    if (!form.city.trim()) {
      toast.error("City is required.");
      setIsEditingAddress(true);
      return;
    }
    if (!form.state.trim()) {
      toast.error("State / Province is required.");
      setIsEditingAddress(true);
      return;
    }
    if (!form.zip.trim()) {
      toast.error("ZIP / Postal code is required.");
      setIsEditingAddress(true);
      return;
    }
    if (!form.country.trim()) {
      toast.error("Country is required.");
      setIsEditingAddress(true);
      return;
    }

    if (isNepalUsdMismatch) {
      toast.error("Nepal shipping address requires NPR (Rs.) currency. Please toggle currency in the header.");
      return;
    }

    if (isNonNepalNprMismatch) {
      toast.error("International shipping address requires USD ($) currency. Please toggle currency in the header.");
      return;
    }

    if (paymentSettings.gateways.length === 0) {
      toast.error(
        "No payment gateways are enabled. Please contact the store administrator.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Sync local cart to server database first
      await syncCartToServer(token, activeItems);

      const res = await checkoutOrder(token, {
        shipping_address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
          country: form.country.trim(),
        },
        notes: form.notes || undefined,
        currency,
      });

      const order = res.data;
      setOrderId(order.id);
      setOrderNumber(order.order_number);
      setOrderSubtotal(parseFloat(String(order.subtotal || order.total)));
      setOrderDiscount(parseFloat(String(order.discount_amount || 0)));
      setOrderTotal(parseFloat(String(order.total)));

      // Save valid address to local storage
      const storageKey = user
        ? `b2b_shipping_address_${user.id}`
        : "b2b_shipping_address";
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
          country: form.country.trim(),
          notes: form.notes,
        }),
      );
      setIsEditingAddress(false);

      // Snapshot the summary items *now*, from the live store, so the
      // payment-step display reflects whatever currency was active at
      // submit time (not whatever it was when the page first mounted).
      // Must happen before clearCart() empties the store.
      setCheckoutItems(activeItems);
      setCheckoutDiscount(discountTotal());

      // Empties the cart store locally upon successful order creation
      clearCart();

      setStep("payment");
      toast.success("Order created successfully. Complete payment to confirm.");
    } catch (err) {
      console.log("CHECKOUT ERROR:", err); // temp debug
      const message =
        err instanceof Error ? err.message : "Could not create order.";
      // Backend guards against variants that went inactive after this
      // page's initial cart load (stale is_active snapshot); surface that
      // clearly so the user knows to revisit their cart rather than retry
      // blindly.
      if (/inactive/i.test(message)) {
        toast.error(
          `${message} Please remove it from your cart and try again.`,
        );
        setUnavailableNotice(message);

        // Best-effort: the backend only gives us the variant name (e.g.
        // "Product variant 'Red' is inactive"), not its variantId, so we
        // can only auto-flag it locally when exactly one cart item's name
        // matches. Otherwise the banner below is the fallback.
        const quoted = message.match(/'([^']+)'/)?.[1];
        if (quoted) {
          const matches = activeItems.filter(
            (i) =>
              i.name?.toLowerCase().includes(quoted.toLowerCase()) ||
              i.variantName?.toLowerCase().includes(quoted.toLowerCase()),
          );
          if (matches.length === 1) {
            markItemInactive(matches[0].variantId);
            setCheckoutItems((prev) =>
              prev.map((i) =>
                i.variantId === matches[0].variantId
                  ? { ...i, is_active: false, isUnavailable: true }
                  : i,
              ),
            );
          }
        }
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePay = async () => {
    const token = getAuthToken();
    if (!token || !orderId || !selectedGateway) {
      toast.error("Select a payment method.");
      return;
    }

    if (isCurrencyAddressMismatch) {
      toast.error("Currency mismatch detected for selected shipping address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // For COD, we call the same initiate endpoint — the backend records the payment as COD
      const payment = await initiatePayment(token, orderId, selectedGateway);

      if (selectedGateway === "cod") {
        toast.success("Order confirmed! You will pay upon delivery.");
        clearCart();
        router.push(
          `/payment-verify?gateway=cod&order_id=${orderId}&status=success`,
        );
        return;
      }

      if (selectedGateway === "esewa" && payment.esewa) {
        setEsewaConfig({
          config: payment.esewa,
          paymentId: payment.payment_id,
          amount: payment.amount,
        });
        setStep("redirecting");
        return;
      }

      if (selectedGateway === "paypal" && payment.paypal) {
        sessionStorage.setItem(
          "pending_payment_config",
          JSON.stringify(payment),
        );
        router.push(
          `/payment?order_id=${orderId}&payment_id=${payment.payment_id}&gateway=paypal`,
        );
        return;
      }

      toast.error("Payment gateway configuration is incomplete.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment initiation failed.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSummaryItems = step === "shipping" ? items : checkoutItems;

  if (!isMounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8 pb-16 animate-pulse">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-2">&gt;</span>
          <Link href="/cart" className="hover:text-primary">
            Cart
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-primary font-medium">Checkout</span>
        </nav>

        <h1 className="text-2xl font-semibold text-primary mb-2">Checkout</h1>
        <div className="grid lg:grid-cols-5 gap-8 mt-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-64 bg-gray-100 rounded-xl" />
          </div>
          <div className="lg:col-span-2 border border-gray-200 rounded-2xl p-5 bg-white space-y-4">
            <div className="h-8 bg-gray-100 rounded w-1/2" />
            <div className="h-32 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (activeSummaryItems.length === 0 && step === "shipping") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">No items to checkout.</p>
        <Link href="/cart" className="text-primary font-medium hover:underline">
          Back to cart
        </Link>
      </div>
    );
  }

  if (step === "redirecting" && esewaConfig) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">Redirecting to eSewa…</p>
        <EsewaPaymentForm
          config={esewaConfig.config}
          paymentId={esewaConfig.paymentId}
          amount={esewaConfig.amount}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-10 py-8 pb-16">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-2">&gt;</span>
        <Link href="/cart" className="hover:text-primary">
          Cart
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-primary font-medium">Checkout</span>
      </nav>

      <h1 className="text-2xl font-semibold text-primary mb-2">Checkout</h1>
      <p className="text-sm text-gray-500 mb-6">
        {step === "shipping"
          ? " "
          : `Payment${orderNumber ? ` — Order #${orderNumber}` : ""}`}
      </p>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          {step === "shipping" ? (
            <>
              <h2 className="font-medium text-gray-900 text-base">
                Shipping address
              </h2>
              {!isEditingAddress ? (
                <div className="border border-gray-200 bg-zinc-50/30 rounded-xl p-5 space-y-2">
                  <div className="text-sm text-gray-700 space-y-2">
                    <div>
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-wider text-zinc-400 block mb-0.5">
                        Street Address
                      </span>
                      <span className="text-gray-800 font-medium">
                        {form.street}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-wider text-zinc-400 block mb-0.5">
                        City, State, ZIP
                      </span>
                      <span className="text-gray-800 font-medium">
                        {form.city}, {form.state} {form.zip}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-wider text-zinc-400 block mb-0.5">
                        Country
                      </span>
                      <span className="text-gray-800 font-medium">
                        {form.country}
                      </span>
                    </div>
                    {form.notes ? (
                      <div className="pt-1">
                        <span className="font-bold text-gray-900 text-xs uppercase tracking-wider text-zinc-400 block mb-0.5">
                          Order Notes
                        </span>
                        <span className="text-gray-800 font-medium italic">
                          "{form.notes}"
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(true)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit shipping details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const storageKey = user
                          ? `b2b_shipping_address_${user.id}`
                          : "b2b_shipping_address";
                        localStorage.removeItem(storageKey);
                        setForm({
                          street: "",
                          city: "",
                          state: "",
                          zip: "",
                          country: "Nepal",
                          notes: "",
                        });
                        setIsEditingAddress(true);
                      }}
                      className="px-4 py-2 bg-white border border-red-100 rounded-lg text-sm font-semibold text-red-650 hover:bg-red-50 transition-colors"
                    >
                      Clear address
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(e) => handleChange("street", e.target.value)}
                      placeholder="e.g. 123 street"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="e.g. Kathmandu"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        State / Province <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                        placeholder="e.g. Bagmati"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        value={form.zip}
                        onChange={(e) => handleChange("zip", e.target.value)}
                        placeholder="e.g. 44600"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.country}
                        onChange={(e) =>
                          handleChange("country", e.target.value)
                        }
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none bg-white focus:border-primary transition-all focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="Nepal">Nepal</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-750 block mb-1">
                  Order notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Any special instructions for delivery..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              {isNepalUsdMismatch && (
                <p className="text-xs text-red-650 font-semibold mb-3 text-center bg-red-50 border border-red-200 rounded-lg p-2.5">
                  Nepal shipping address requires NPR (Rs.) currency. Please switch the currency to Rs. in the header.
                </p>
              )}
              {isNonNepalNprMismatch && (
                <p className="text-xs text-red-650 font-semibold mb-3 text-center bg-red-50 border border-red-200 rounded-lg p-2.5">
                  International shipping address requires USD ($) currency. Please switch the currency to $ in the header.
                </p>
              )}

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={isSubmitting || isCurrencyAddressMismatch || activeSummaryItems.some((i) => i.is_active === false)}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer text-sm"
              >
                {isSubmitting ? "Creating order…" : "Continue to payment"}
              </button>
            </>
          ) : (
            <>
              <h2 className="font-medium text-gray-900 text-base">
                Payment method
              </h2>
              {activeGateways.length === 0 ? (
                <p className="text-sm text-destructive">
                  No payment gateways are enabled.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeGateways.map((gateway) => {
                    const isDisabled = isGatewayDisabledForCurrency(
                      gateway.id,
                    );
                    const unavailableReason =
                      gateway.id === "esewa"
                        ? "Available for NPR orders only"
                        : gateway.id === "paypal"
                          ? "Available for USD orders only"
                          : null;

                    return (
                      <label
                        key={gateway.id}
                        className={`flex items-start gap-3 border rounded-xl p-4 transition-all ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                            : "cursor-pointer " +
                              (selectedGateway === gateway.id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200")
                        }`}
                      >
                        <input
                          type="radio"
                          name="gateway"
                          checked={selectedGateway === gateway.id}
                          disabled={isDisabled}
                          onChange={() =>
                            !isDisabled && setSelectedGateway(gateway.id)
                          }
                          className="mt-1 accent-primary disabled:cursor-not-allowed"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {gateway.label}
                          </p>
                          <p className="text-sm text-gray-500">
                            {gateway.description}
                          </p>
                          {gateway.id !== "cod" && !isDisabled && (
                            <p className="text-xs text-gray-400 mt-1">
                              Mode: {gateway.mode}
                            </p>
                          )}
                          {isDisabled && unavailableReason && (
                            <p className="text-xs text-red-500 mt-1 font-medium">
                              {unavailableReason}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {isCurrencyAddressMismatch && (
                <p className="text-xs text-red-650 font-semibold mb-3 text-center bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {isNepalUsdMismatch 
                    ? "Nepal shipping address requires NPR (Rs.) currency. Please switch the currency to Rs. in the header."
                    : "International shipping address requires USD ($) currency. Please switch the currency to $ in the header."
                  }
                </p>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={
                  isSubmitting ||
                  !selectedGateway ||
                  isGatewayDisabledForCurrency(selectedGateway) ||
                  isCurrencyAddressMismatch
                }
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer text-sm"
              >
                {isSubmitting
                  ? "Processing…"
                  : selectedGateway === "cod"
                    ? "Confirm Order (Cash on Delivery)"
                    : "Pay now"}
              </button>
              <button
                type="button"
                onClick={() => setStep("shipping")}
                className="text-sm text-gray-500 hover:text-primary font-medium mt-2 self-center block text-center"
              >
                Back to shipping
              </button>
            </>
          )}
        </div>

        <div className="lg:col-span-2 border border-gray-200 rounded-2xl p-5 h-fit bg-white shadow-sm space-y-4">
          <h2 className="text-primary font-bold text-base">Order summary</h2>

          {unavailableNotice && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">{unavailableNotice}</p>
              <p className="mt-1 text-red-600">
                Remove it below or{" "}
                <Link href="/cart" className="underline font-medium">
                  go to your cart
                </Link>{" "}
                to update it, then try again.
              </p>
            </div>
          )}

          <div className="space-y-1 divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-1">
            {activeSummaryItems.map((item) => {
              const fullImageUrl = getImageUrl(item.image);
              const isInactive = item.is_active === false;
              return (
                <div
                  key={item.variantId}
                  className={`flex gap-3 py-3 first:pt-0 last:pb-0 ${isInactive ? "opacity-60" : ""}`}
                >
                  {/* Thumbnail Image */}
                  <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {fullImageUrl ? (
                      <img
                        src={fullImageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-gray-400">
                        No Image
                      </span>
                    )}
                  </div>
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className="font-semibold text-gray-850 text-sm truncate"
                        title={item.name}
                      >
                        {item.name}
                      </h4>
                      {isInactive && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                          Unavailable
                        </span>
                      )}
                    </div>
                    {item.variantName && (
                      <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                        Variant: {item.variantName}
                      </p>
                    )}
                    {isInactive ? (
                      <button
                        type="button"
                        onClick={() => {
                          removeItem(item.variantId);
                          setCheckoutItems((prev) =>
                            prev.filter((i) => i.variantId !== item.variantId),
                          );
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline mt-1"
                      >
                        Remove from order
                      </button>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          Qty: {item.quantity} × {formatCheckoutPrice(item.price)}
                        </p>
                        {item.discount > 0 && (
                          <p className="text-xs text-green-600 font-medium">
                            Discount: -{formatCheckoutPrice(item.discount)} each
                          </p>
                        )}
                        <p className="text-xs font-bold text-primary mt-1">
                          Total:{" "}
                          {formatCheckoutPrice(
                            (item.price - (item.discount ?? 0)) * item.quantity,
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm text-gray-600 font-medium">
              <span>Total Gross:</span>
              <span>
                {step === "payment" && orderSubtotal > 0
                  ? formatCheckoutPrice(orderSubtotal)
                  : formatCheckoutPrice(total)}
              </span>
            </div>

            {activeDiscount > 0 ? (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Discount:</span>
                <span>- {formatCheckoutPrice(activeDiscount)}</span>
              </div>
            ) : null}

            <div className="flex justify-between font-bold text-primary text-base border-t border-dashed border-gray-200 pt-2 mt-2">
              <span>Amount to be Paid</span>
              <span>
                {step === "payment" && orderTotal > 0
                  ? formatCheckoutPrice(orderTotal)
                  : formatCheckoutPrice(total - activeDiscount)}
              </span>
            </div>
          </div>

          <Link
            href="/cart"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-150 hover:text-primary transition-all text-center"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}