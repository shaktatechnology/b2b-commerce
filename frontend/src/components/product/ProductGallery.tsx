"use client";

import { Heart } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  activeIndex?: number;
  onChangeImage?: (index: number) => void;
}

export default function ProductGallery({
  images,
  productName,
  activeIndex = 0,
  onChangeImage,
}: ProductGalleryProps) {
  const galleryImages = images.length > 0 ? images : [];
  const mainImage = galleryImages[activeIndex] ?? null;

  return (
    <div className="w-full">
      <div className="relative aspect-square max-w-lg mx-auto lg:mx-0 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={productName}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm p-6 text-center">
            {productName}
          </div>
        )}
        <button
          type="button"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary shadow-sm"
          aria-label="Add to wishlist"
        >
          <Heart size={18} />
        </button>
      </div>

      {galleryImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {galleryImages.slice(0, 4).map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => onChangeImage?.(index)}
              className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 border rounded overflow-hidden bg-gray-50 ${
                activeIndex === index
                  ? "border-primary ring-1 ring-primary"
                  : "border-gray-200"
              }`}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
