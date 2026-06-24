"use client";

import { Play } from "lucide-react";

interface GalleryItem {
  url: string;
  type: 'image' | 'video';
}

interface ProductGalleryProps {
  items: GalleryItem[];
  productName: string;
  activeIndex?: number;
  onChangeImage?: (index: number) => void;
}

export default function ProductGallery({
  items,
  productName,
  activeIndex = 0,
  onChangeImage,
}: ProductGalleryProps) {
  const galleryItems = items.length > 0 ? items : [];
  const mainItem = galleryItems[activeIndex] ?? null;

  return (
    <div className="w-full">
      <div className="relative aspect-square max-w-lg mx-auto lg:mx-0 border border-gray-200 rounded-3xl bg-gray-50 overflow-hidden shadow-sm group">
        {mainItem ? (
          mainItem.type === 'video' ? (
            <video
              src={mainItem.url}
              className="h-full w-full object-cover"
              controls
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={mainItem.url}
              alt={productName}
              className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            />
          )
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm p-6 text-center">
            {productName}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 ml-1">
          Product Gallery (Images & Videos)
        </h3>
        {galleryItems.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
          {galleryItems.map((item, index) => (
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
              {item.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <Play className="size-6 text-white/50" />
                  <div className="absolute top-1 right-1 px-1 bg-black/50 rounded-md">
                      <span className="text-[8px] text-white font-bold uppercase">Video</span>
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
        )}
      </div>
    </div>
  );
}
