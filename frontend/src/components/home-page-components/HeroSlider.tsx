"use client";

import Link from "next/link";
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
  const getOfferLink = (offer: Offer) => {
    const offerBrandId = offer.brand_id || null;
    const linkParams = new URLSearchParams();
    linkParams.set("offer_id", String(offer.id));
    if (offerBrandId) linkParams.set("brand", offerBrandId);
    if (offer.product_ids && offer.product_ids.length === 1) {
      linkParams.set("product_id", String(offer.product_ids[0]));
    }
    return `/products?${linkParams.toString()}`;
  };

  const processedSlides = offers.length > 0 
    ? offers.map(o => ({
        image: resolveImage(o),
        link: getOfferLink(o),
        title: o.title
      })) 
    : slides.map(s => ({
        image: s,
        link: null,
        title: "Banner"
      }));

  if (processedSlides.length === 0) return null;

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
          {processedSlides.map((slide, index) => (
            <SwiperSlide key={index} className="!w-auto">
              <div className="relative h-[180px] sm:h-[220px] md:h-[300px]">
                {slide.link ? (
                  <Link href={slide.link} className="relative block h-full">
                    <Image
                      src={slide.image}
                      alt={slide.title || `Banner ${index + 1}`}
                      width={600}
                      height={300}
                      priority={index === 0}
                      className="h-full w-auto object-contain rounded-xl hover:opacity-90 transition-opacity"
                      unoptimized
                    />
                  </Link>
                ) : (
                  <Image
                    src={slide.image}
                    alt={slide.title || `Banner ${index + 1}`}
                    width={600}
                    height={300}
                    priority={index === 0}
                    className="h-full w-auto object-contain rounded-xl"
                    unoptimized
                  />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </>
  );
}


