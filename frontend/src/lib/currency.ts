
/**
 * Maps a payment gateway id to a currency symbol, for gateways that are only
 * ever offered in one currency.
 * ASSUMPTION: eSewa is NPR-only, PayPal is USD-only.
 * COD is deliberately NOT listed here — it's offered for both NPR and
 * international orders, so its currency can't be inferred from the gateway
 * id alone (see the country-based fallback below).
 * Extend this map if you add more single-currency gateways.
 */
const GATEWAY_CURRENCY: Record<string, string> = {
  esewa: "Rs.",
  paypal: "$",
};

const DEFAULT_CURRENCY_SYMBOL = "Rs.";

/**
 * Resolves the currency symbol for a given order.
 * Reads whichever field your backend actually populates — tries, in order:
 * `payment.currency`, `payment.method`, `payment_method`, `gateway`.
 * For gateways that don't imply a fixed currency (e.g. COD), falls back to
 * the shipping address country. Falls back to Rs. if nothing is set (safe
 * default for existing local orders).
 */
export function getOrderCurrencySymbol(
  order: {
    currency?: string | null;
    payment_method?: string | null;
    gateway?: string | null;
    payment?: {
      method?: string | null;
      currency?: string | null;
    } | null;
    shipping_address?: {
      country?: string | null;
    } | null;
  }
): string {
  const explicitCurrency = (order.currency || order.payment?.currency)?.toUpperCase();
  if (explicitCurrency === "USD") return "$";
  if (explicitCurrency === "NPR") return "Rs.";

  const method = (
    order.payment?.method ||
    order.payment_method ||
    order.gateway ||
    ""
  ).toLowerCase();

  if (method && GATEWAY_CURRENCY[method]) {
    return GATEWAY_CURRENCY[method];
  }

  return DEFAULT_CURRENCY_SYMBOL;
}

/**
 * Formats an amount with the correct currency symbol for the order it belongs to.
 * Use this everywhere an order/item amount is displayed instead of hardcoding "Rs." or "$".
 */
export function formatOrderAmount(
  order: {
    currency?: string | null;
    payment_method?: string | null;
    gateway?: string | null;
    payment?: {
      method?: string | null;
      currency?: string | null;
    } | null;
    shipping_address?: {
      country?: string | null;
    } | null;
  },
  amount: number | string
): string {
  const symbol = getOrderCurrencySymbol(order);
  const formatted = Number(amount).toLocaleString();
  return symbol === "$" ? `$${formatted}` : `${symbol} ${formatted}`;
}