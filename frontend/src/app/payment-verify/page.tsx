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

      const data = await apiFetch<{ data: { order_id: string } }>("/payments/verify", {
        method: "POST",
        token,
        body: JSON.stringify(verifyParams),
      });

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
        <div className="text-center max-w-md">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Payment Verification Failed
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

  return null;
}
