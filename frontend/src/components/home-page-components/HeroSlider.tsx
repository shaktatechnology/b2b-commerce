"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import { Offer } from "@/src/types/offer";

type Props = {
  slides?: string[];
  offers?: Offer[];
};

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

function resolveImage(offer: Offer | string): string {
  if (typeof offer === "string") return offer;
  const raw = offer.image_url || offer.image;
  if (!raw) return "/placeholder.png";
  if (raw.startsWith("http") || raw.startsWith("blob")) return raw;
  if (raw.startsWith("/storage/")) return `${STORAGE_URL}${raw}`;
  if (raw.startsWith("storage/")) return `${STORAGE_URL}/${raw}`;
  if (raw.startsWith("/")) return `${STORAGE_URL}${raw}`;
  return `${STORAGE_URL}/storage/${raw}`;
}

export default function HeroSlider({ slides = [], offers = [] }: Props) {
  const allSlides = offers.length > 0 ? offers.map(o => resolveImage(o)) : slides;

  if (allSlides.length === 0) return null;

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 md:px-0 py-4 md:py-6 overflow-hidden relative">
        <Swiper
          modules={[Autoplay, Pagination]}
          loop={true}
          slidesPerView="auto"
          spaceBetween={12}
          speed={6000}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
          }}
          allowTouchMove={false}
          pagination={{
            clickable: true,
            renderBullet: (index, className) => {
              return `<span class="${className} custom-bullet"></span>`;
            },
          }}
          className="hero-swiper"
        >
          {allSlides.map((slide, index) => (
            <SwiperSlide key={index} className="!w-auto">
              <div className="relative h-[180px] sm:h-[220px] md:h-[300px]">
                <Image
                  src={slide}
                  alt={`Banner ${index + 1}`}
                  width={600}
                  height={300}
                  priority={index === 0}
                  className="h-full w-auto object-contain rounded-xl"
                  unoptimized
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </>
  );
}


