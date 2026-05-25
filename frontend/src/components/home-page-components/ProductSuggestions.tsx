'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, Star, Clock, ShoppingBag, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variant {
  retail_price?: number | string;
  price?: number | string;
}

interface Category {
  id: number | string;
  name: string;
  slug?: string;
}

interface Product {
  id: number | string;
  name: string;
  slug: string;
  image?: string;
  thumbnail?: string;
  image_url?: string;
  images?: { url?: string; image_path?: string }[];
  variants?: Variant[];
  price?: number | string;
  categories?: Category[];
}

interface Tab {
  key: string;
  label: string;
  icon: React.ReactNode;
  products: Product[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getImageUrl = (p: Product): string => {
  const path =
    p.image || p.thumbnail || p.image_url ||
    p.images?.[0]?.url || p.images?.[0]?.image_path || '';
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${storageUrl}${normalizedPath}`;
};

const getPrice = (p: Product): string => {
  const raw = p.variants?.[0]?.retail_price ?? p.variants?.[0]?.price ?? p.price;
  if (!raw) return '—';
  return `Rs. ${Number(raw).toLocaleString()}`;
};

const getCategoryName = (p: Product): string =>
  p.categories?.[0]?.name ?? 'Uncategorised';

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, index }: { product: Product; index: number }) {
  const imgUrl = getImageUrl(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex items-center gap-3 py-3 border-b border-dashed border-gray-100 last:border-0 hover:bg-orange-50/40 -mx-2 px-2 rounded-lg transition-colors duration-200"
    >
      {/* Image */}
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={product.name}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="size-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {product.name}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          By {getCategoryName(product)}
        </p>
        <p className="text-[13px] font-bold text-orange-500 mt-1">
          {getPrice(product)}
        </p>
      </div>

      <ChevronRight className="size-4 text-gray-300 group-hover:text-orange-400 shrink-0 transition-colors" />
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductSuggestions({ products }: { products: Product[] }) {
  const [activeTab, setActiveTab] = React.useState('top_selling');

  // Shuffle deterministically per tab using product id as seed
  const shuffle = (arr: Product[], seed: number) =>
    [...arr].sort((a, b) => ((Number(a.id) * seed) % 7) - ((Number(b.id) * seed) % 7));

  const display = products.slice(0, 20); // cap to 20

  const tabs: Tab[] = [
    {
      key: 'top_selling',
      label: 'Top Selling',
      icon: <ShoppingBag className="size-3.5" />,
      products: display,
    },
    {
      key: 'trending',
      label: 'Trending',
      icon: <TrendingUp className="size-3.5" />,
      products: shuffle(display, 3),
    },
    {
      key: 'recently_added',
      label: 'Recently Added',
      icon: <Clock className="size-3.5" />,
      // Reverse to simulate "newest first"
      products: [...display].reverse(),
    },
    {
      key: 'top_rated',
      label: 'Top Rated',
      icon: <Star className="size-3.5" />,
      products: shuffle(display, 13),
    },
  ];

  const activeProducts = tabs.find(t => t.key === activeTab)?.products ?? [];

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-10 py-10">
      {/* ── Tab Header ── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-50 p-1 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-white text-orange-600 shadow-sm border border-orange-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60',
            ].join(' ')}
          >
            <span className={activeTab === tab.key ? 'text-orange-500' : 'text-gray-400'}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-6">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={[
              'bg-white rounded-2xl border border-gray-100 p-4 shadow-sm transition-all duration-300',
              // On mobile/tablet only show the active tab; on lg always show all
              activeTab === tab.key ? 'block' : 'hidden lg:block',
            ].join(' ')}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <span className="h-7 w-7 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                {tab.icon}
              </span>
              <h3 className="text-[13px] font-black text-gray-700 uppercase tracking-wide">
                {tab.label}
              </h3>
            </div>

            {/* Products */}
            <div>
              {tab.products.slice(0, 5).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            {/* View all */}
            <Link
              href="/products"
              className="mt-3 flex items-center justify-center gap-1 text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors py-2 rounded-xl hover:bg-orange-50"
            >
              View All <ChevronRight className="size-3" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}