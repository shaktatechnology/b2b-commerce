import type { PaymentGatewayId, PaymentSettings } from '@/src/types/payment-settings';

export function parsePaymentSettings(
  paymentGroup: Record<string, string | null>
): PaymentSettings {
  const gateways: PaymentSettings['gateways'] = [];

  const isEsewaActive = String(paymentGroup.esewa_active) === '1' || paymentGroup.esewa_active === 'true' || (paymentGroup.esewa_active as any) === true;
  if (isEsewaActive) {
    gateways.push({
      id: 'esewa',
      label: 'eSewa',
      description: 'Pay with eSewa mobile wallet (Nepal)',
      mode: paymentGroup.esewa_mode ?? 'sandbox',
    });
  }

  const isPaypalActive = String(paymentGroup.paypal_active) === '1' || paymentGroup.paypal_active === 'true' || (paymentGroup.paypal_active as any) === true;
  if (isPaypalActive) {
    gateways.push({
      id: 'paypal',
      label: 'PayPal',
      description: 'Pay with PayPal (International)',
      mode: paymentGroup.paypal_mode ?? 'sandbox',
    });
  }

  const isCodActive = String(paymentGroup.cod_active) === '1' || paymentGroup.cod_active === 'true' || (paymentGroup.cod_active as any) === true || paymentGroup.payment_gateway === 'cod';
  if (isCodActive) {
    gateways.push({
      id: 'cod',
      label: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      mode: 'live',
    });
  }

  const preferred = (paymentGroup.payment_gateway ?? 'esewa') as PaymentGatewayId;
  const defaultGateway =
    gateways.find((g) => g.id === preferred)?.id ?? gateways[0]?.id ?? null;

  return { defaultGateway, gateways };
}
