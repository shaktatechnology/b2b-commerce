"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuthToken } from "@/src/lib/auth";
import { useCartStore } from "@/src/store/use-cart-store";

import { apiFetch } from "@/src/lib/api";

export default function PaymentVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your payment...</p>
          </div>
        </div>
      }
    >
      <PaymentVerifyContent />
    </Suspense>
  );
}

function PaymentVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  const paymentId = searchParams.get("payment_id");
  const gateway = searchParams.get("gateway");
  const status = searchParams.get("status");
  const orderId = searchParams.get("order_id");

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, [paymentId, gateway, status]);

  const verifyPayment = async () => {
    try {
      // COD orders don't need payment gateway verification
      if (gateway === "cod" && orderId) {
        clearCart();
        toast.success("Order confirmed! You will pay on delivery.");
        setTimeout(() => {
          router.push(`/order-confirmation?order_id=${orderId}`);
        }, 1500);
        return;
      }

      if (status === "failed" || status === "canceled" || status === "cancelled") {
        setError("Payment was cancelled or failed.");
        setVerifying(false);
        return;
      }

      if (!paymentId || !gateway || !status) {
        setError("Invalid payment verification parameters");
        setVerifying(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Collect all callback parameters for verification
      const verifyParams: Record<string, string> = {};
      const queryParams = new URLSearchParams(searchParams);
      queryParams.forEach((value, key) => {
        verifyParams[key] = value;
      });

      const data = await apiFetch<{ data: { order_id: string; status: string } }>("/payments/verify", {
        method: "POST",
        token,
        body: JSON.stringify(verifyParams),
      });

      if (data.data?.status !== "completed") {
        setError("Payment was not completed.");
        setVerifying(false);
        return;
      }

      clearCart();
      toast.success("Payment verified successfully!");
      
      // Redirect to order confirmation
      setTimeout(() => {
        router.push(`/order-confirmation?order_id=${data.data.order_id}`);
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment verification failed";
      setError(message);
      toast.error(message);
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            ✕
          </div>
          <div className="text-gray-900 text-lg font-bold mb-2">
            Payment Failed or Cancelled
          </div>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(orderId ? `/account/orders/${orderId}` : "/account?tab=orders")}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              View Order Details
            </button>
            <button
              onClick={() => router.push("/account?tab=orders")}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              All Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
