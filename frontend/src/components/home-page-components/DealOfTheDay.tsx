"use client";

import Link from "next/link";
import DealOfTheDayCard from "../cards/DealOfTheDayCard";

export interface DealProduct {
  id: number | string;
  name: string;
  image_url?: string;
  images?: { url: string; is_primary?: boolean }[];
  deal_variant_image?: string;
  deal_variant_id?: string;
  price?: number;
  variants?: { id?: string; retail_price: number; image_url?: string }[];
  reviews_count?: number;
  reviews_avg_rating?: number;
  brand?: { name: string } | string;
  deal_discount_value?: number;
  deal_discount_type?: string;
}

interface Props {
  dealProducts: DealProduct[];
}

export default function DealOfTheDay({ dealProducts }: Props) {
  if (!dealProducts || dealProducts.length === 0) return null;

  // Homepage shows top 3
  const topDeals = dealProducts.slice(0, 3);

  return (
    <section className="deal-section">
      <div className="deal-section__header">
        <h2 className="deal-section__title">Deal Of Day</h2>
        <Link href="/deals" className="deal-section__view-all">
          View All
        </Link>
      </div>

      <div className="deal-section__grid">
        {topDeals.map((product) => (
          <DealOfTheDayCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
