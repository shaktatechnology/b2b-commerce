"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

// Accept any shape the API might return
interface Offer {
  id: string | number;
  title?: string;
  image?: string | null;
  image_url?: string | null;
  placement?: string | null;
  is_active?: boolean | number | null;
  starts_at?: string | null;
  ends_at?: string | null;
}

interface Props {
  offers: Offer[];
}
const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

function resolveImage(offer: Offer): string {
  const raw = offer.image_url || offer.image;
  if (!raw) return "/placeholder.png";
  if (raw.startsWith("http") || raw.startsWith("blob")) return raw;
  if (raw.startsWith("/storage/")) return `${STORAGE_URL}${raw}`;
  if (raw.startsWith("storage/")) return `${STORAGE_URL}/${raw}`;
  if (raw.startsWith("/")) return `${STORAGE_URL}${raw}`;
  return `${STORAGE_URL}/storage/${raw}`;
}

// Match any variant the backend might send for "page"
const MID_PLACEMENTS = new Set(["page", "Page", "Page Specific", "page_specific"]);

function parseBackendDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr.replace(' ', 'T') + 'Z');
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function isOfferLive(offer: Offer): boolean {
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

function BannerCard({
  offer,
  className = "",
  index = 0,
}: {
  offer: Offer;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden group cursor-pointer bg-gray-100 ${className}`}
    >
      <Image
        src={resolveImage(offer)}
        alt={offer.title || "Offer Banner"}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 33vw"
        unoptimized
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      <Link href={`/products?offer_id=${offer.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {offer.title}</span>
      </Link>
    </motion.div>
  );
}

export default function MiddleSectionOffers({ offers }: Props) {
  const midOffers = offers
    .filter((o) => o.placement != null && MID_PLACEMENTS.has(o.placement) && isOfferLive(o))
    .slice(0, 5); // 4 for the grid + 1 tall banner

  if (typeof window !== "undefined") {
    console.log("[MiddleSectionOffers] all offers:", offers.map(o => ({ id: o.id, placement: o.placement, is_active: o.is_active })));
    console.log("[MiddleSectionOffers] mid offers:", midOffers.length);
  }

  if (midOffers.length === 0) return null;

  const [a, b, c, d, tall] = midOffers;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-10 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left 2/3: even 2x2 grid */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {a && <BannerCard offer={a} className="h-[170px] md:h-[190px]" index={0} />}
          {b && <BannerCard offer={b} className="h-[170px] md:h-[190px]" index={1} />}
          {c && <BannerCard offer={c} className="h-[170px] md:h-[190px]" index={2} />}
          {d && <BannerCard offer={d} className="h-[170px] md:h-[190px]" index={3} />}
        </div>

        {/* Right 1/3: tall banner full height */}
        {tall && (
          <BannerCard offer={tall} className="h-[300px] md:h-full min-h-[395px]" index={4} />
        )}
      </div>
    </section>
  );
}