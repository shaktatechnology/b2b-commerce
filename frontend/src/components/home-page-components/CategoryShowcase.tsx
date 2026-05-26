"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

interface Product {
  id: string | number;
  name: string;
  slug: string;
  image_url?: string | null;
  thumbnail?: string | null;
  image?: string | null;
  variants?: { retail_price: string | number }[];
  categories?: { name: string }[];
}

interface Category {
  id: string | number;
  name: string;
  slug: string;
  parent_id?: string | number | null;
}

interface CategoryShowcaseProps {
  category: Category;
  subCategories?: Category[];
  products: Product[];
}

const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000";

const resolveImageUrl = (product: Product) => {
  const raw = product.image_url || product.thumbnail || product.image;
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/storage/")) return `${STORAGE_URL}${raw}`;
  if (raw.startsWith("storage/")) return `${STORAGE_URL}/${raw}`;
  if (raw.startsWith("/")) return `${STORAGE_URL}${raw}`;
  return `${STORAGE_URL}/storage/${raw}`;
};

const ProductMiniCard = ({ product }: { product: Product }) => {
  const price = parseFloat(String(product.variants?.[0]?.retail_price || "0"));
  const image = resolveImageUrl(product);
  const categoryName = product.categories?.[0]?.name || "Uncategorized";

  return (
    <div className="bg-white rounded-xl p-3 flex flex-col h-[280px] sm:h-[300px] shadow-sm hover:shadow-md transition-shadow group">
      <Link href={`/products/${product.slug}`} className="block flex-1 min-w-0">
        <div className="aspect-square w-full rounded-lg overflow-hidden bg-zinc-50 flex items-center justify-center p-2 relative">
          {image ? (
            <img src={image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="text-[10px] text-zinc-400 font-bold text-center px-2">{product.name}</div>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-[9px] text-primary/70 font-black uppercase tracking-widest leading-none truncate">{categoryName}</p>
          <h4 className="text-[11px] sm:text-xs font-bold text-zinc-800 line-clamp-2 h-8 sm:h-9 leading-tight">
            {product.name}
          </h4>
        </div>
      </Link>
      <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-50">
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-black text-primary">Rs.{price}</span>
        </div>
        <button className="bg-primary text-white p-2 sm:p-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 active:scale-95">
          <ShoppingCart size={14} />
        </button>
      </div>
    </div>
  );
};

export default function CategoryShowcase({ category, subCategories = [], products }: CategoryShowcaseProps) {
  // Only use products that belong to this category
  // Include products from the parent category and all its sub-categories
  const relevantCategoryNames = [category.name, ...subCategories.map(s => s.name)];
  
  const filteredProducts = products.filter(p => 
    p.categories?.some(c => relevantCategoryNames.includes(c.name))
  ).slice(0, 12); // Showing a few more for better slider coverage

  if (filteredProducts.length === 0) return null;

  const mainProduct = filteredProducts[0];
  const sliderProducts = filteredProducts.slice(1);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-10 py-2">
      <div className="bg-[#966FD6] rounded-[20px] p-4 sm:p-6 lg:p-8 relative overflow-hidden shadow-xl shadow-primary/20">
        {/* Header decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        {/* Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10">
          <div className="space-y-1">
            <p className="text-white/80 text-sm font-bold text-center uppercase tracking-widest">Best Deals on</p>
            <h2 className="px-5 text-4xl sm:text-5xl font-black text-center text-white tracking-tight">{category.name}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {subCategories.slice(0, 4).map((sub) => (
              <Link 
                key={sub.id} 
                href={`/products?category=${sub.slug}`}
                className="px-4 py-1.5 bg-white/20 hover:bg-white text-white hover:text-primary rounded-full text-xs font-bold transition-all border border-white/10 hover:border-white shadow-sm"
              >
                {sub.name}
              </Link>
            ))}
            <Link 
              href={`/products?category=${category.slug}`}
              className="ml-auto lg:ml-4 text-white/90 hover:text-white text-sm font-black flex items-center gap-1 group transition-colors"
            >
              View All <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
          {/* Featured Large Card */}
          <div className="lg:col-span-1">
            <Link href={`/products/${mainProduct.slug}`} className="block h-full group">
              <div className="bg-white rounded-2xl p-4 h-full flex flex-col items-center justify-center text-center shadow-lg group-hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-3">
                    <div className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md animate-pulse">FEATURED</div>
                 </div>
                 <div className="w-full aspect-square flex items-center justify-center p-4">
                    <img 
                      src={resolveImageUrl(mainProduct) || "/placeholder.png"} 
                      alt={mainProduct.name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700" 
                    />
                 </div>
                 <div className="mt-4 space-y-2">
                    <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-[0.2em]">{mainProduct.categories?.[0]?.name}</p>
                    <h3 className="text-xl font-black text-zinc-900 group-hover:text-primary transition-colors line-clamp-2">{mainProduct.name}</h3>
                    <div className="pt-2">
                       <span className="text-2xl font-black text-primary">Rs.{parseFloat(String(mainProduct.variants?.[0]?.retail_price || "0"))}</span>
                    </div>
                 </div>
              </div>
            </Link>
          </div>

          {/* Slider for other products */}
          <div className="lg:col-span-3 relative group/slider">
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: ".cat-showcase-prev",
                nextEl: ".cat-showcase-next",
              }}
              spaceBetween={16}
              slidesPerView={1.2}
              breakpoints={{
                480: { slidesPerView: 2.2 },
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 },
              }}
              className="px-1"
            >
              {sliderProducts.map((p) => (
                <SwiperSlide key={p.id}>
                  <ProductMiniCard product={p} />
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* Custom Navigation Buttons */}
            <button className="cat-showcase-prev absolute top-1/2 left-0 -ml-3 sm:-ml-5 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all scale-0 group-hover/slider:scale-100 focus:outline-none ring-4 ring-primary/5 disabled:opacity-0">
              <ChevronLeft size={24} className="mr-0.5" />
            </button>
            <button className="cat-showcase-next absolute top-1/2 right-0 -mr-3 sm:-mr-5 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all scale-0 group-hover/slider:scale-100 focus:outline-none ring-4 ring-primary/5 disabled:opacity-0">
              <ChevronRight size={24} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
