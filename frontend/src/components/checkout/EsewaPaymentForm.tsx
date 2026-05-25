"use client";

import { useEffect, useRef } from "react";
import type { EsewaPaymentConfig } from "@/src/lib/payment-api";

interface EsewaPaymentFormProps {
  config: EsewaPaymentConfig;
  paymentId: string;
  amount: number;
}

export default function EsewaPaymentForm({
  config,
  paymentId,
  amount,
}: EsewaPaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const formattedAmount = amount.toFixed(2);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form
      ref={formRef}
      method="POST"
      action={config.action_url}
      className="hidden"
      aria-hidden
    >
      <input type="hidden" name="amount" value={formattedAmount} />
      <input type="hidden" name="tax_amount" value="0" />
      <input type="hidden" name="total_amount" value={formattedAmount} />
      <input type="hidden" name="transaction_uuid" value={paymentId} />
      <input type="hidden" name="product_code" value={config.merchant_code} />
      <input type="hidden" name="product_service_charge" value="0" />
      <input type="hidden" name="product_delivery_charge" value="0" />
      <input type="hidden" name="success_url" value={config.success_url} />
      <input type="hidden" name="failure_url" value={config.failure_url} />
      <input
        type="hidden"
        name="signed_field_names"
        value="total_amount,transaction_uuid,product_code"
      />
      <input type="hidden" name="signature" value={config.signature} />
    </form>
  );
}
