"use client";

import DealOfTheDayCard from "../cards/DealOfTheDayCard";

export interface DealProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  reviews: number;
  brand: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

interface Props {
  dealProducts: DealProduct[];
}

export default function DealOfTheDay({ dealProducts }: Props) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">Deal Of The Day</h2>

        <button className="text-sm text-gray-500 hover:text-black transition">
          View All
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {dealProducts.map((product) => (
          <DealOfTheDayCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
