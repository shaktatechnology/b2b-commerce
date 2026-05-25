"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
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
  product: DealProduct;
}

export default function DealOfTheDayCard({ product }: Props) {
  return (
    <div className="relative rounded-[10px] overflow-hidden group max-w-[320px] mx-auto">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width:768px) 100vw, 33vw"
          className="object-cover hover:scale-105 transition-transform duration-500"
        />

        {/* Product Tag 
        <Link 
          href={`/products/${product.id}`}
          className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all duration-300 hover:bg-primary hover:text-white group/tag"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover/tag:bg-white" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Products</span>
        </Link>*/}
      </div>

      <div className="relative -mt-12 sm:-mt-16 mx-auto w-[92%] bg-[#f5f5f5] rounded-xl p-4 sm:p-5 shadow-sm z-20">
        <h3 className="text-[15px] sm:text-[18px] leading-6 sm:leading-7 font-semibold text-gray-800 line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center text-yellow-400">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                size={18}
                fill="currentColor"
                strokeWidth={1.5}
              />
            ))}
          </div>

          <span className="text-sm text-gray-400">
            ({product.reviews} reviews)
          </span>
        </div>

        <p className="mt-3 text-[15px] text-gray-500">
          By{" "}
          <span className="text-primary font-medium">
            {product.brand}
          </span>
        </p>

        <div className="flex items-center justify-between mt-5">
          <h2 className="text-2xl sm:text-4xl font-bold text-primary">
            Rs.{product.price}
          </h2>

          <button className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-purple-500 hover:text-white transition-all duration-300">
            <ShoppingCart size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}