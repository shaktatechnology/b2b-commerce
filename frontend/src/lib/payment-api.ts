import { apiFetch } from './api';

export interface EsewaPaymentConfig {
  merchant_code: string;
  signature: string;
  mode: string;
  action_url: string;
  success_url: string;
  failure_url: string;
}

export interface InitiatePaymentData {
  payment_id: string;
  order_id: string;
  order_number: string;
  amount: number;
  gateway: string;
  esewa?: EsewaPaymentConfig;
  paypal?: {
    client_id: string;
    mode: string;
  };
}

export async function initiatePayment(
  token: string,
  orderId: string,
  gateway: string
): Promise<InitiatePaymentData> {
  const res = await apiFetch<{ data: InitiatePaymentData }>('/payments/initiate', {
    method: 'POST',
    token,
    body: JSON.stringify({ order_id: orderId, gateway }),
  });
  return res.data;
}
