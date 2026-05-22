"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

type Props = {
  slides: string[];
};

export default function HeroSlider({ slides }: Props) {
  return (
    <>
      <section className="w-full py-6 overflow-hidden relative">
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
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className="!w-auto">
              <div className="relative h-[300px]">
                <Image
                  src={slide}
                  alt={`Banner ${index + 1}`}
                  width={600}
                  height={300}
                  priority
                  className="h-full w-auto object-contain rounded-xl"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </>
  );
}
