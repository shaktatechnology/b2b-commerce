"use client";

import { useState, useEffect } from "react";
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

  const [step, setStep] = useState<Step>("shipping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Stored copy of checked out items so they persist in the UI summary when local cart is cleared
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);

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

  useEffect(() => {
    setCurrency(getActiveCurrency());
    const handleCurrencyChange = () => setCurrency(getActiveCurrency());
    window.addEventListener("currency_changed", handleCurrencyChange);
    return () =>
      window.removeEventListener("currency_changed", handleCurrencyChange);
  }, []);

  const formatCheckoutPrice = (amount: number) => formatPrice(amount, currency);

  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(true);

  // eSewa only for NPR, PayPal only for USD, COD for both
  const activeGateways = paymentSettings.gateways.filter((g) => {
    if (currency === "NPR") {
      return g.id === "esewa" || g.id === "cod";
    } else {
      return g.id === "paypal" || g.id === "cod";
    }
  });

  // Make sure we select a valid default gateway whenever activeGateways changes
  useEffect(() => {
    const validIds = activeGateways.map((g) => g.id);
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
    activeGateways,
    selectedGateway,
    paymentSettings.defaultGateway,
  ]);

  // Set checkoutItems from cart items as soon as they are loaded
  useEffect(() => {
    if (items.length > 0 && checkoutItems.length === 0) {
      setCheckoutItems(items);
      setCheckoutDiscount(discountTotal());
    }
  }, [items, checkoutItems, discountTotal]);

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

  const total = subtotal();
  const activeDiscount =
    step === "shipping"
      ? discountTotal()
      : orderDiscount > 0
        ? orderDiscount
        : checkoutDiscount;

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-set currency & translate cart items based on country selection
      if (field === "country") {
        const nextCur =
          value.toLowerCase() === "nepal" ? getActiveCurrency() : "USD";
        localStorage.setItem("currency_preference", nextCur);
        useCartStore.getState().syncCurrency(nextCur);
        window.dispatchEvent(new Event("currency_changed"));
      }

      return updated;
    });
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

      // Empties the cart store locally upon successful order creation
      clearCart();

      setStep("payment");
      toast.success("Order created successfully. Complete payment to confirm.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create order.";
      toast.error(message);
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

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={isSubmitting}
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
                  No payment gateways are active for the selected country.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeGateways.map((gateway) => (
                    <label
                      key={gateway.id}
                      className={`flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-all ${
                        selectedGateway === gateway.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gateway"
                        checked={selectedGateway === gateway.id}
                        onChange={() => setSelectedGateway(gateway.id)}
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {gateway.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {gateway.description}
                        </p>
                        {gateway.id !== "cod" && (
                          <p className="text-xs text-gray-400 mt-1">
                            Mode: {gateway.mode}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handlePay}
                disabled={isSubmitting || !selectedGateway}
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

          <div className="space-y-1 divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-1">
            {activeSummaryItems.map((item) => {
              const fullImageUrl = getImageUrl(item.image);
              return (
                <div
                  key={item.variantId}
                  className="flex gap-3 py-3 first:pt-0 last:pb-0"
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
                    <h4
                      className="font-semibold text-gray-800 text-sm truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h4>
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
