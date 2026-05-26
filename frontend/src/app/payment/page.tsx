"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import PayPalPaymentForm from "@/src/components/checkout/PaypalPaymentForm";
import EsewaPaymentForm from "@/src/components/checkout/EsewaPaymentForm";
import { getAuthToken } from "@/src/lib/auth";
import { apiFetch } from "@/src/lib/api";
import type { EsewaPaymentConfig } from "@/src/lib/payment-api";

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment gateway...</p>
          </div>
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const paymentId = searchParams.get("payment_id");
  const gateway = searchParams.get("gateway");

  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !paymentId || !gateway) {
      setError("Invalid payment parameters");
      setLoading(false);
      return;
    }

    // Try reading cached configuration from sessionStorage first
    const stored = sessionStorage.getItem("pending_payment_config");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.payment_id === paymentId && parsed.order_id === orderId) {
          setPaymentConfig(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // Fall back to API fetch
      }
    }

    // Fetch from backend dynamic show endpoint if sessionStorage is not present
    fetchPaymentConfig();
  }, [orderId, paymentId, gateway]);

  const fetchPaymentConfig = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login?redirect=/checkout");
        return;
      }

      const data = await apiFetch<{ data: any }>(
        `/payments/${paymentId}?order_id=${orderId}&gateway=${gateway}`,
        { token }
      );

      // Verify the returned state contains the gateway configuration
      const config = data.data;
      if (!config || (gateway === "paypal" && !config.paypal) || (gateway === "esewa" && !config.esewa)) {
        throw new Error("Payment gateway credentials or configuration not found.");
      }

      setPaymentConfig(config);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load payment configuration.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment gateway...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Payment Error
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/checkout")}
            className="bg-primary text-white px-6 py-2 rounded hover:opacity-90"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  if (gateway === "esewa" && paymentConfig?.esewa) {
    return (
      <EsewaPaymentForm
        config={paymentConfig.esewa}
        paymentId={paymentId!}
        amount={Number(paymentConfig.amount)}
      />
    );
  }

  if (gateway === "paypal" && paymentConfig?.paypal) {
    return (
      <PayPalPaymentForm
        clientId={paymentConfig.paypal.client_id}
        mode={paymentConfig.paypal.mode}
        orderId={orderId!}
        paymentId={paymentId!}
        amount={Number(paymentConfig.amount)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-gray-600 mb-6">
          Payment gateway configuration not found
        </div>
        <button
          onClick={() => router.push("/checkout")}
          className="bg-primary text-white px-6 py-2 rounded hover:opacity-90"
        >
          Back to Checkout
        </button>
      </div>
    </div>
  );
}
