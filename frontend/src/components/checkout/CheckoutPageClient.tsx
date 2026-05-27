"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/src/store/use-cart-store";
import { formatRs } from "@/src/lib/product-utils";
import { getAuthToken } from "@/src/lib/auth";
import { syncCartToServer, checkoutOrder } from "@/src/lib/cart-api";
import { initiatePayment } from "@/src/lib/payment-api";
import type { PaymentSettings, PaymentGatewayId } from "@/src/types/payment-settings";
import EsewaPaymentForm from "./EsewaPaymentForm";

interface CheckoutPageClientProps {
  paymentSettings: PaymentSettings;
}

type Step = "shipping" | "payment" | "redirecting";

export default function CheckoutPageClient({
  paymentSettings,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<Step>("shipping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayId | null>(
    paymentSettings.defaultGateway
  );
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

  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(true);

  useEffect(() => {
    // Clear any pending payment configs from previous sessions
    sessionStorage.removeItem("pending_payment_config");
    
    const savedAddress = localStorage.getItem("b2b_shipping_address");
    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress);
        setForm((prev) => ({ ...prev, ...parsed }));
        // If there's a saved address, default to not showing the edit form
        setIsEditingAddress(false);
      } catch (e) {
        console.error("Failed to parse saved address");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("b2b_shipping_address", JSON.stringify(form));
  }, [form]);

  const total = subtotal();

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOrder = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login?redirect=/checkout");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      router.push("/cart");
      return;
    }

    if (paymentSettings.gateways.length === 0) {
      toast.error(
        "No payment gateways are enabled. Please contact the store administrator."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await syncCartToServer(token, items);
      const res = await checkoutOrder(token, {
        shipping_address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
        notes: form.notes || undefined,
      });

      const order = res.data;
      setOrderId(order.id);
      setOrderNumber(order.order_number);
      setOrderTotal(parseFloat(String(order.total)));
      setStep("payment");
      toast.success("Order created. Complete payment to confirm.");
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
      const payment = await initiatePayment(token, orderId, selectedGateway);

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
        // Stash the full config so the /payment page can render PayPal without a second API call
        sessionStorage.setItem("pending_payment_config", JSON.stringify(payment));
        router.push(
          `/payment?order_id=${orderId}&payment_id=${payment.payment_id}&gateway=paypal`
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

  if (items.length === 0 && step === "shipping") {
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
              <h2 className="font-medium text-gray-900">Shipping address</h2>
              {!isEditingAddress ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">{form.street}</div>
                    <div>
                      {form.city}, {form.state} {form.zip}
                    </div>
                    <div className="text-xs text-gray-500">{form.country}</div>
                    {form.notes ? (
                      <div className="mt-2 text-sm text-gray-600">Notes: {form.notes}</div>
                    ) : null}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(true)}
                      className="px-3 py-1 bg-white border rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("b2b_shipping_address");
                        setForm({ street: "", city: "", state: "", zip: "", country: "Nepal", notes: "" });
                        setIsEditingAddress(true);
                      }}
                      className="px-3 py-1 bg-white border rounded text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                (
                  [
                    ["street", "Street address"],
                    ["city", "City"],
                    ["state", "State / Province"],
                    ["zip", "ZIP / Postal code"],
                    ["country", "Country"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-sm text-gray-600 block mb-1">{label}</label>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                ))
              )}
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Order notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={isSubmitting}
                className="w-full bg-primary text-white font-medium py-3 rounded hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Creating order…" : "Continue to payment"}
              </button>
            </>
          ) : (
            <>
              <h2 className="font-medium text-gray-900">Payment method</h2>
              {paymentSettings.gateways.length === 0 ? (
                <p className="text-sm text-destructive">
                  No payment gateways are active. Enable eSewa or PayPal in admin
                  settings.
                </p>
              ) : (
                <div className="space-y-3">
                  {paymentSettings.gateways.map((gateway) => (
                    <label
                      key={gateway.id}
                      className={`flex items-start gap-3 border rounded-lg p-4 cursor-pointer ${
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
                        <p className="font-medium text-gray-900">
                          {gateway.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {gateway.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Mode: {gateway.mode}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handlePay}
                disabled={isSubmitting || !selectedGateway}
                className="w-full bg-primary text-white font-medium py-3 rounded hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Processing…" : "Pay now"}
              </button>
              <button
                type="button"
                onClick={() => setStep("shipping")}
                className="text-sm text-gray-500 hover:text-primary"
              >
                Back to shipping
              </button>
            </>
          )}
        </div>

        <div className="lg:col-span-2 border border-gray-200 rounded-lg p-5 h-fit">
          <h2 className="text-primary font-semibold mb-4">Order summary</h2>
          <ul className="space-y-2 text-sm mb-4 max-h-52 overflow-y-auto">
            {items.map((item) => (
              <li key={item.variantId} className="flex justify-between gap-2">
                <span className="line-clamp-1 text-gray-700">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium shrink-0">
                  {formatRs(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t pt-3 flex justify-between font-bold text-primary">
            <span>Total</span>
            <span>
              {step === "payment" && orderTotal > 0
                ? formatRs(orderTotal)
                : formatRs(total)}
            </span>
          </div>
          <Link
          href="/cart"
          className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
        >
          Back to cart
        </Link>
        </div>
      </div>
    </div>
  );
}
