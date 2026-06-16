"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { getAuthToken } from "@/src/lib/auth";

import { apiFetch } from "@/src/lib/api";

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await apiFetch<{ data: Order }>(`/orders/${orderId}`, {
        token,
      });
      setOrder(res.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load order";
      toast.error(message);
      setTimeout(() => router.push("/"), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Order Not Found
          </div>
          <p className="text-gray-600 mb-6">
            The order could not be found or accessed.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-white px-6 py-2 rounded hover:opacity-90"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for your purchase. Your order has been successfully
            placed and payment has been received.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-semibold text-gray-900">
                  {order.order_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Status:</span>
                <span
                  className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    order.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span
                  className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    order.payment_status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.payment_status.charAt(0).toUpperCase() +
                    order.payment_status.slice(1)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <span className="text-gray-900 font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  Rs. {parseFloat(String(order.total)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • We will prepare your order and send you a shipment
                confirmation shortly
              </li>
              <li>• Track your order status in your account dashboard</li>
              <li>• You'll receive email updates about your shipment</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account?tab=orders"
              className="inline-block bg-primary text-white px-8 py-3 rounded hover:opacity-90 font-medium"
            >
              View My Orders
            </Link>
            <Link
              href="/"
              className="inline-block bg-gray-200 text-gray-900 px-8 py-3 rounded hover:bg-gray-300 font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
