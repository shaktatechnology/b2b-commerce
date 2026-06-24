'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, Star, Clock, ShoppingBag, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

import { resolveProductImageUrl, getProductPath, productToCartLineItem } from '@/src/lib/product-utils';
import type { StorefrontProduct } from '@/src/types/storefront';

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: StorefrontProduct }) {
  const lineItem = productToCartLineItem(product as any);
  const basePrice = lineItem?.price ?? 0;
  const discountAmount = lineItem?.discount ?? 0;
  const finalPrice = basePrice - discountAmount;
  const hasDiscount = discountAmount > 0;

  const firstImage = product.images?.find(img => img.type === 'image') || product.images?.find(img => !img.type);
  const imgUrl = resolveProductImageUrl(
    lineItem?.image ?? firstImage?.url ?? product.image_url
  );

  return (
    <Link
      href={getProductPath({ id: product.id, slug: product.slug })}
      className="group flex items-center gap-3 sm:gap-4 py-3 sm:py-4 last:border-0 hover:bg-primary/5 -mx-2 px-2 rounded-lg transition-colors duration-200"
    >
      {/* Image */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-sm flex items-center justify-center p-1">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="size-6 sm:size-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] sm:text-[14px] font-medium text-gray-900 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </p>
        <div className="flex flex-col mt-1">
          <p className="text-[14px] sm:text-[16px] font-bold text-primary leading-none">
            Rs. {finalPrice.toFixed(0)}
          </p>
          {hasDiscount && (
            <p className="text-[11px] text-gray-400 line-through mt-0.5">
              Rs. {basePrice.toFixed(0)}
            </p>
          )}
        </div>
        <p className="text-[11px] sm:text-[12px] text-primary/70 mt-1 truncate">
          By {product.categories?.[0]?.name ?? 'Uncategorised'}
        </p>
      </div>
    </Link>
  );
}

interface Tab {
  key: string;
  label: string;
  icon: React.ReactNode;
  products: StorefrontProduct[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductSuggestions({ products }: { products: StorefrontProduct[] }) {
  const [activeTab, setActiveTab] = React.useState('top_selling');

  // Shuffle deterministically per tab using product id as seed
  const shuffle = (arr: StorefrontProduct[], seed: number) =>
    [...arr].sort((a, b) => ((Number(String(a.id).replace(/\D/g, '')) * seed) % 7) - ((Number(String(b.id).replace(/\D/g, '')) * seed) % 7));

  const display = products.slice(0, 20); // cap to 20

  const tabs: Tab[] = [
    {
      key: 'top_selling',
      label: 'Top Selling Product',
      icon: <ShoppingBag className="size-3.5" />,
      products: display,
    },
    {
      key: 'trending',
      label: 'Trending Product',
      icon: <TrendingUp className="size-3.5" />,
      products: shuffle(display, 3),
    },
    {
      key: 'recently_added',
      label: 'Recently added',
      icon: <Clock className="size-3.5" />,
      products: [...display].reverse(),
    },
    {
      key: 'top_rated',
      label: 'Top Rated',
      icon: <Star className="size-3.5" />,
      products: shuffle(display, 13),
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-16">
      {/* ── Mobile Tab Navigation (Hidden on LG) ── */}
      <div className="flex lg:hidden flex-wrap gap-1 mb-6 sm:mb-8 bg-gray-50 p-1.5 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all duration-200 whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm ring-1 ring-primary/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60',
            ].join(' ')}
          >
            {tab.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={[
              'bg-white transition-all duration-300',
              // On mobile/tablet only show the active tab; on lg always show all
              activeTab === tab.key ? 'block' : 'hidden lg:block',
            ].join(' ')}
          >
            {/* Column header with Underline style */}
            <div className="relative mb-4 sm:mb-6 pb-2">
              <h3 className="text-[17px] sm:text-[20px] font-medium text-primary">
                {tab.label}
              </h3>
              <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-[3px] bg-primary rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-gray-100"></div>
            </div>

            {/* Products */}
            <div className="divide-y divide-gray-50">
              {tab.products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* View all */}
            <Link
              href="/products"
              className="mt-4 flex items-center justify-start gap-1 text-[13px] font-medium text-gray-400 hover:text-primary transition-colors"
            >
              View All <ChevronRight className="size-3" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}