import type { PaymentGatewayId, PaymentSettings } from '@/src/types/payment-settings';

export function parsePaymentSettings(
  paymentGroup: Record<string, string | null>
): PaymentSettings {
  const gateways: PaymentSettings['gateways'] = [];

  if (paymentGroup.esewa_active === '1') {
    gateways.push({
      id: 'esewa',
      label: 'eSewa',
      description: 'Pay with eSewa mobile wallet (Nepal)',
      mode: paymentGroup.esewa_mode ?? 'sandbox',
    });
  }

  if (paymentGroup.paypal_active === '1') {
    gateways.push({
      id: 'paypal',
      label: 'PayPal',
      description: 'Pay with PayPal (International)',
      mode: paymentGroup.paypal_mode ?? 'sandbox',
    });
  }

  if (paymentGroup.cod_active === '1') {
    gateways.push({
      id: 'cod',
      label: 'Cash on Delivery',
      description: 'Pay with cash when your order is delivered',
      mode: 'live',
    });
  }

  const preferred = (paymentGroup.payment_gateway ?? 'esewa') as PaymentGatewayId;
  const defaultGateway =
    gateways.find((g) => g.id === preferred)?.id ?? gateways[0]?.id ?? null;

  return { defaultGateway, gateways };
}
