import type { Order } from "@/src/types/orders";

/**
 * Maps a payment gateway id to a currency symbol.
 * ASSUMPTION: eSewa / COD orders are in NPR ("Rs."), PayPal orders are in USD ("$").
 * Extend this map if you add more gateways with different currencies.
 */
const GATEWAY_CURRENCY: Record<string, string> = {
  esewa: "Rs.",
  cod: "Rs.",
  paypal: "$",
};

const DEFAULT_CURRENCY_SYMBOL = "Rs.";

/**
 * Resolves the currency symbol for a given order.
 * Reads whichever field your backend actually populates — tries, in order:
 * `payment.currency`, `payment.method`, `payment_method`, `gateway`.
 * Falls back to Rs. if nothing is set (safe default for existing local orders).
 */
export function getOrderCurrencySymbol(
  order: Pick<Order, "payment_method" | "gateway" | "payment">
): string {
  const explicitCurrency = order.payment?.currency?.toUpperCase();
  if (explicitCurrency === "USD") return "$";
  if (explicitCurrency === "NPR") return "Rs.";

  const method = (
    order.payment?.method ||
    order.payment_method ||
    order.gateway ||
    ""
  ).toLowerCase();

  return GATEWAY_CURRENCY[method] ?? DEFAULT_CURRENCY_SYMBOL;
}

/**
 * Formats an amount with the correct currency symbol for the order it belongs to.
 * Use this everywhere an order/item amount is displayed instead of hardcoding "Rs." or "$".
 */
export function formatOrderAmount(
  order: Pick<Order, "payment_method" | "gateway" | "payment">,
  amount: number | string
): string {
  const symbol = getOrderCurrencySymbol(order);
  const formatted = Number(amount).toLocaleString();
  return symbol === "$" ? `$${formatted}` : `${symbol} ${formatted}`;
}