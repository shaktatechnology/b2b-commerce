import { Offer } from "../types/offer";

export function parseBackendDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // If it's Y-m-d H:i:s, assume UTC by appending Z
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr.replace(' ', 'T') + 'Z');
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function isOfferLive(offer: Offer): boolean {
  const active = offer.is_active == null ? true : Boolean(Number(offer.is_active));
  if (!active) return false;
  const now = new Date();
  if (offer.starts_at) {
    const start = parseBackendDate(offer.starts_at);
    if (start && now < start) return false;
  }
  if (offer.ends_at) {
    const end = parseBackendDate(offer.ends_at);
    if (end && now > end) return false;
  }
  return true;
}

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

export function resolveOfferImage(raw: string | null | undefined): string {
  if (!raw) return "/placeholder.png";
  if (raw.startsWith("http") || raw.startsWith("blob")) return raw;
  if (raw.startsWith("/storage/")) return `${STORAGE_URL}${raw}`;
  if (raw.startsWith("storage/")) return `${STORAGE_URL}/${raw}`;
  if (raw.startsWith("/")) return `${STORAGE_URL}${raw}`;
  return `${STORAGE_URL}/storage/${raw}`;
}

export function getOfferLink(offer: Offer): string {
  const linkParams = new URLSearchParams();
  linkParams.set("offer_id", String(offer.id));
  if (offer.brand_id) linkParams.set("brand", offer.brand_id);
  if (offer.product_ids && offer.product_ids.length === 1) {
    linkParams.set("product_id", String(offer.product_ids[0]));
  }
  return `/products?${linkParams.toString()}`;
}
