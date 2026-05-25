"use client";

import Image from "next/image";
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
    <div className="relative rounded-[26px] overflow-hidden">
      <div className="relative h-[200px] sm:h-[260px] w-full overflow-hidden rounded-[20px] sm:rounded-[26px]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width:768px) 100vw, 33vw"
          className="object-cover hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute bottom-[90px] sm:bottom-[110px] left-1/2 -translate-x-1/2 w-[90%] bg-white/40 backdrop-blur-md rounded-xl px-3 sm:px-4 py-2 sm:py-3 flex justify-between shadow-md">
          {[
            { label: "Days", value: product.days },
            { label: "Hours", value: product.hours },
            { label: "Minutes", value: product.minutes },
            { label: "Seconds", value: product.seconds },
          ].map((item, index) => (
            <div key={index} className="text-center flex-1">
              <p className="text-[10px] sm:text-xs text-black mb-1">{item.label}</p>
              <h4 className="text-[18px] sm:text-[22px] font-bold text-black">
                {item.value}
              </h4>
            </div>
          ))}
        </div>
      </div>

      <div className="relative -mt-16 sm:-mt-20 mx-auto w-[88%] bg-[#f5f5f5] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm z-20">
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