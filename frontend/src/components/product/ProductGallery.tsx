"use client";

import { Play } from "lucide-react";
import { useEffect, useRef } from "react";

interface GalleryItem {
  url: string;
  type: "image" | "video";
}

interface ProductGalleryProps {
  items: GalleryItem[];
  /** Images shown in the "Product Gallery" thumbnail strip — product-level only, no variant images */
  thumbnailItems?: GalleryItem[];
  productName: string;
  activeIndex?: number;
  onChangeImage?: (index: number) => void;
  /** Explicit total count of primary & gallery images to display in badge denominator */
  totalGalleryCount?: number;
}

export default function ProductGallery({
  items,
  thumbnailItems,
  productName,
  activeIndex = 0,
  onChangeImage,
  totalGalleryCount,
}: ProductGalleryProps) {
  const galleryItems = items.length > 0 ? items : [];
  // Thumbnail strip items: use explicit list if provided, otherwise fall back to all items
  const stripItems = thumbnailItems ?? galleryItems;
  const countDenominator = totalGalleryCount ?? stripItems.length;
  const sliderRef = useRef<HTMLDivElement>(null);

  // the isProgrammaticScroll guard for the next swipe).
  const isSwipeScroll = useRef(false);

  // a mid-animation index and kick off a new scroll.
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    // If this activeIndex change came from the user swiping, the container is
    // already at the right scroll position — skip scrollTo.
    if (isSwipeScroll.current) {
      isSwipeScroll.current = false;
      return;
    }

    // External change (thumbnail click / variant select) — scroll programmatically.
    if (!sliderRef.current) return;
    const el = sliderRef.current;
    isProgrammaticScroll.current = true;
    requestAnimationFrame(() => {
      el.scrollTo({ left: activeIndex * el.clientWidth, behavior: "smooth" });
      // Clear after smooth animation completes (~300-400 ms)
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    });
  }, [activeIndex]);

  return (
    <div className="w-full">
      <div
        ref={sliderRef}
        className="relative flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-3xl border border-gray-200 bg-gray-50 aspect-square"
        onScroll={(e) => {
          // Ignore events fired by our own programmatic scrollTo
          if (isProgrammaticScroll.current) return;
          const container = e.currentTarget;
          const index = Math.round(container.scrollLeft / container.clientWidth);
          if (index !== activeIndex) {
            // Mark as swipe so the useEffect won't issue a redundant scrollTo
            isSwipeScroll.current = true;
            onChangeImage?.(index);
          }
        }}
      >
        {galleryItems.map((item, index) => (
          <div
            key={index}
            className="min-w-full snap-center h-full flex items-center justify-center"
          >
            {item.type === "video" ? (
              <video
                src={item.url}
                controls
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={item.url}
                alt={productName}
                className="h-full w-full object-contain p-4"
              />
            )}
          </div>
        ))}

        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
          {Math.min(activeIndex + 1, countDenominator)}/{countDenominator}
        </div>
      </div>

      {/* Thumbnail strip — product gallery images only, hidden if empty */}
      {stripItems.length > 0 && (
        <div className="hidden md:block mt-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 ml-1">
            Product Gallery (Images &amp; Videos)
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
            {stripItems.map((item, index) => (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => onChangeImage?.(index)}
                className={`w-20 h-20 shrink-0 border-2 rounded-2xl overflow-hidden bg-gray-50 transition-all relative ${
                  activeIndex === index
                    ? "border-[#966FD6] shadow-md scale-105"
                    : "border-gray-100 hover:border-gray-300"
                }`}
              >
                {item.type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Play className="size-6 text-white/50" />
                    <div className="absolute top-1 right-1 px-1 bg-black/50 rounded-md">
                      <span className="text-[8px] text-white font-bold uppercase">
                        Video
                      </span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
