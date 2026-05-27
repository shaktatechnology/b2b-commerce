"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuthToken } from "@/src/lib/auth";
import { apiFetch } from "@/src/lib/api";

interface PayPalPaymentFormProps {
  clientId: string;
  mode: "sandbox" | "live";
  orderId: string;
  amount: number;
  paymentId: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export default function PayPalPaymentForm({
  clientId,
  mode,
  orderId,
  amount,
  paymentId,
  onSuccess,
  onError,
}: PayPalPaymentFormProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const paypalButtonInstance = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const renderButtons = async () => {
      if (!window.paypal || !containerRef.current || !isMounted) return;

      try {
        // Clear container first to avoid duplicate buttons
        containerRef.current.innerHTML = "";

        // Close any previous instance before creating a new one
        if (paypalButtonInstance.current) {
          try {
            if (typeof paypalButtonInstance.current.close === "function") {
              await paypalButtonInstance.current.close();
            }
          } catch (e) {
            console.warn("Error closing previous PayPal buttons:", e);
          }
          paypalButtonInstance.current = null;
        }

        const buttons = window.paypal.Buttons({
          createOrder: async (_data: any, _actions: any) => {
            try {
              const token = getAuthToken();
              if (!token) {
                throw new Error("User session has expired. Please log in again.");
              }

              const res = await apiFetch<{ paypal_order_id: string }>(
                "/paypal/create-order",
                {
                  method: "POST",
                  token,
                  body: JSON.stringify({
                    payment_id: paymentId,
                    order_id: orderId,
                    amount: amount,
                  }),
                }
              );

              return res.paypal_order_id;
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Order creation failed"
              );
              throw error;
            }
          },

          onApprove: async (data: any, _actions: any) => {
            try {
              const token = getAuthToken();
              if (!token) {
                throw new Error("User session has expired. Please log in again.");
              }

              await apiFetch(
                "/paypal/capture-order",
                {
                  method: "POST",
                  token,
                  body: JSON.stringify({
                    payment_id: paymentId,
                    paypal_order_id: data.orderID,
                  }),
                }
              );

              toast.success("Payment completed successfully!");
              sessionStorage.removeItem("pending_payment_config");
              onSuccess?.();
              router.push(`/order-confirmation?order_id=${orderId}`);
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Payment capture failed"
              );
              onError?.();
            }
          },

          onError: (err: any) => {
            console.error("PayPal error:", err);
            toast.error("Payment failed. Please try again.");
            onError?.();
          },
        });

        paypalButtonInstance.current = buttons;

        if (containerRef.current && isMounted) {
          await buttons.render(containerRef.current);
        }
      } catch (err) {
        console.error("Error rendering PayPal buttons:", err);
      }
    };

    // Load PayPal script dynamically or reuse it if already loaded
    let script = document.querySelector('script[src*="paypal.com/sdk/js"]') as HTMLScriptElement;
    
    const handleScriptLoad = () => {
      if (isMounted) renderButtons();
    };

    if (window.paypal) {
      renderButtons();
    } else if (script) {
      script.addEventListener("load", handleScriptLoad);
    } else {
      script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&commit=true`;
      script.async = true;
      
      script.addEventListener("load", handleScriptLoad);
      script.addEventListener("error", () => {
        toast.error("Failed to load PayPal SDK");
        onError?.();
      });
      
      document.body.appendChild(script);
    }

    return () => {
      isMounted = false;
      if (script) {
        script.removeEventListener("load", handleScriptLoad);
      }
      if (paypalButtonInstance.current) {
        try {
          if (typeof paypalButtonInstance.current.close === "function") {
            paypalButtonInstance.current.close().catch((err: any) => {
              console.warn("PayPal button close promise error:", err);
            });
          }
        } catch (err) {
          console.warn("Error closing PayPal button instance on cleanup:", err);
        }
        paypalButtonInstance.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [clientId, orderId, amount, paymentId, onSuccess, onError, router]);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Complete Payment with PayPal
        </h2>
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Order Amount</p>
          <p className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Order ID: {orderId}</p>
        </div>
        <div ref={containerRef}></div>
      </div>
    </div>
  );
}
