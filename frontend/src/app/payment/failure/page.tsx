'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, Loader2 } from 'lucide-react';

function PaymentFailureInner() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <div className="bg-red-50 rounded-full p-6">
        <XCircle className="size-16 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Payment Failed</h1>
      <p className="text-gray-500 max-w-md">
        Your payment could not be completed. No amount has been charged.
        {paymentId && (
          <span className="block text-xs text-gray-400 mt-1">Reference: {paymentId}</span>
        )}
      </p>
      <div className="flex gap-3 mt-4">
        <Link
          href="/cart"
          className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90"
        >
          Back to Cart
        </Link>
        <Link
          href="/"
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
          <Loader2 className="size-10 text-primary animate-spin" />
        </div>
      }
    >
      <PaymentFailureInner />
    </Suspense>
  );
}
