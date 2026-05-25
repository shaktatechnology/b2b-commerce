export type PaymentGatewayId = 'esewa' | 'paypal';

export interface PaymentGatewayOption {
  id: PaymentGatewayId;
  label: string;
  description: string;
  mode: string;
}

export interface PaymentSettings {
  defaultGateway: PaymentGatewayId | null;
  gateways: PaymentGatewayOption[];
}
