import type { PaymentGatewayId, PaymentSettings } from '@/src/types/payment-settings';

export function parsePaymentSettings(
  paymentGroup: Record<string, any>
): PaymentSettings {
  const gateways: PaymentSettings['gateways'] = [];

  const isActive = (val: any) => 
    val === '1' || val === 1 || val === 'true' || val === true || val === 'on' || val === 'active';

  if (isActive(paymentGroup.esewa_active)) {
    gateways.push({
      id: 'esewa',
      label: 'eSewa',
      description: 'Pay with eSewa mobile wallet (Nepal)',
      mode: paymentGroup.esewa_mode ?? 'sandbox',
    });
  }

  if (isActive(paymentGroup.paypal_active)) {
    gateways.push({
      id: 'paypal',
      label: 'PayPal',
      description: 'Pay with PayPal (International)',
      mode: paymentGroup.paypal_mode ?? 'sandbox',
    });
  }

  if (isActive(paymentGroup.cod_active)) {
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
