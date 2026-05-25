import { apiFetch } from './api';
import type { CartLineItem } from '@/src/types/cart';

export async function syncCartToServer(
  token: string,
  items: CartLineItem[]
): Promise<void> {
  await apiFetch('/cart/sync', {
    method: 'POST',
    token,
    body: JSON.stringify({
      items: items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    }),
  });
}

export interface CheckoutPayload {
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes?: string;
}

export interface PlacedOrder {
  id: string;
  order_number: string;
  total: number | string;
  payment_status?: string;
}

export async function checkoutOrder(token: string, payload: CheckoutPayload) {
  return apiFetch<{ message: string; data: PlacedOrder }>('/orders', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
