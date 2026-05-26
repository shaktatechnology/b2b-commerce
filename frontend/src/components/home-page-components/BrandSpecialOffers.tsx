"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Offer } from "../../types/offer";
import { X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  offers: Offer[];
  categories?: Category[];
}

const defaultOffers = [
  {
    id: "default-1",
    image: "/offers/shoe_offer.png",
    title: "Shoe Collection",
    description: "Up to 50% Off",
    link: "/products?category=shoes",
    bgColor: "bg-[#8B1A1A]",
  },
  {
    id: "default-2",
    image: "/offers/electronics_offer.png",
    title: "Electronics Sale",
    description: "45% Discount",
    link: "/products?category=electronics",
    bgColor: "bg-[#1A237E]",
  },
  {
    id: "default-3",
    image: "/offers/saree_offer.png",
    title: "Saree Special",
    description: "Flat 50% Off",
    link: "/products?category=saree",
    bgColor: "bg-[#FBC02D]",
  },
];

// Matches any "top" variant the backend might send
const TOP_PLACEMENTS = new Set(["top", "Top Banner", "top_banner"]);

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

function resolveImage(raw: string | null | undefined): string {
  if (!raw) return "/placeholder.png";
  if (raw.startsWith("http") || raw.startsWith("blob")) return raw;
  if (raw.startsWith("/storage/")) return `${STORAGE_URL}${raw}`;
  if (raw.startsWith("storage/")) return `${STORAGE_URL}/${raw}`;
  if (raw.startsWith("/")) return `${STORAGE_URL}${raw}`;
  return `${STORAGE_URL}/storage/${raw}`;
}

function parseBackendDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // If it's Y-m-d H:i:s, assume UTC by appending Z
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

export default function BrandSpecialOffers({ offers, categories = [] }: Props) {
  // Filter to live "top" placement offers only — fall back to defaults if none
  const topOffers = offers.filter(
    (o) => o.placement != null && TOP_PLACEMENTS.has(o.placement) && isOfferLive(o)
  );

  const displayOffers = topOffers.length > 0
    ? topOffers.slice(0, 3).map((offer, idx) => ({
        id: offer.id,
        image: resolveImage(offer.image_url || offer.image),
        title: offer.title,
        description: offer.description || "",
        link: `/products?offer_id=${offer.id}`,
        bgColor: idx === 0 ? "bg-[#8B1A1A]" : idx === 1 ? "bg-[#1A237E]" : "bg-[#FBC02D]",
      }))
    : defaultOffers;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content: Brand Special Offers */}
        <div className="w-full lg:w-3/4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Brands Special Offer
            </h2>
            <Link 
              href="/offers" 
              className="text-sm font-medium text-gray-500 hover:text-primary transition-colors"
            >
              View All Offers
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-[10px] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className={`relative aspect-[3/4] w-full ${offer.bgColor}`}>
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                </div>
                
                <Link href={offer.link} className="absolute inset-0 z-10">
                  <span className="sr-only">View {offer.title}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar: Product Tags */}
        <aside className="w-full lg:w-1/4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
            <h2 className="text-2xl font-bold text-primary mb-2">Product Tag</h2>
            <div className="w-12 h-1 bg-primary/30 rounded-full mb-8" />

            <div className="flex flex-wrap gap-3">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full hover:bg-primary/5 hover:border-primary/20 transition-all duration-300"
                >
                  <X size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
              
              {categories.length === 0 && ["Brown", "Coffees", "Cream", "Hodo Foods", "Meats", "Organic", "Snack", "Vegetables"].map((tag) => (
                <div
                  key={tag}
                  className="group flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full hover:bg-primary/5 hover:border-primary/20 cursor-pointer transition-all duration-300"
                >
                  <X size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">
                    {tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </section>
  );
}