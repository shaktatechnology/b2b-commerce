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

      // Always ask backend first before concluding failure
      if (paymentId && gateway) {
        try {
          const data = await apiFetch<{ data: { order_id: string; status: string } }>("/payments/verify", {
            method: "POST",
            token,
            body: JSON.stringify(verifyParams),
          });

          if (data.data?.status === "completed") {
            clearCart();
            toast.success("Payment verified successfully!");
            setTimeout(() => {
              router.push(`/order-confirmation?order_id=${data.data.order_id}`);
            }, 1500);
            return;
          }
        } catch (backendErr) {
          // If backend explicit verification returns an error or non-completed status, fall through to status check
        }
      }

      // Determine specific mild error message based on gateway status query parameter
      if (status === "canceled" || status === "cancelled") {
        setError("Payment was cancelled. If this was accidental, you can try again.");
      } else if (status === "failed") {
        setError("Payment could not be completed. You can try again from your order.");
      } else if (!paymentId || !gateway || !status) {
        setError("Payment parameters were invalid or missing.");
      } else {
        setError("Your payment wasn't completed. If this was accidental, you can try again.");
      }

      setVerifying(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment wasn't completed.";
      setError(message);
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const targetOrderId = orderId || searchParams.get("order_id");

    return (
      <div className="max-w-sm mx-auto mt-24 rounded-xl border bg-white p-6 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
          !
        </div>
        <div className="text-gray-900 text-lg font-semibold mb-2">
          Payment Not Completed
        </div>
        <p className="text-gray-600 text-sm mb-6">{error}</p>
        <div className="flex flex-col gap-2.5">
          {targetOrderId && (
            <button
              onClick={() => router.push(`/account/orders/${targetOrderId}`)}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Try Again / View Order
            </button>
          )}
          <button
            onClick={() => router.push("/account?tab=orders")}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            All Orders
          </button>
        </div>
      </div>
    );
  }

  return null;
}
