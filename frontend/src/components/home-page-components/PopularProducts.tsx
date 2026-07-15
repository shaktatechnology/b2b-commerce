"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, ShoppingBag } from "lucide-react";
import ProductCard from "../cards/ProductCard";
import type { CartProductInput } from "@/src/types/cart";
import { getUserRole } from "@/src/lib/auth";

interface Category {
  id: string;
  name: string;
}

interface PopularProductsProps {
  products: CartProductInput[];
  categories: Category[];
}

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const PopularProducts: React.FC<PopularProductsProps> = ({
  products,
  categories,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'NPR' | 'USD'>('NPR');
  const [role, setRole] = useState<string | null>(null);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(getUserRole());
      const stored = localStorage.getItem('currency_preference');
      if (stored === 'USD' || stored === 'NPR') setCurrency(stored);
      const onChange = () => {
        const val = localStorage.getItem('currency_preference');
        setCurrency(val === 'USD' ? 'USD' : 'NPR');
      };
      window.addEventListener('currency_changed', onChange);
      return () => window.removeEventListener('currency_changed', onChange);
    }
  }, []);

  // Pre-filter: if USD is active, only show products that have international_price set
  const isWholesaler = role === 'wholesaler' || role === 'wholeseller';

  // Exclude products where no active variant has stock > 0
  const inStockProducts = products.filter((p) =>
    p.variants?.some((v: any) => v.is_active && (v.stock ?? 0) > 0)
  );

  const visibleProducts = currency === 'USD'
    ? inStockProducts.filter((p) =>
        p.variants?.some((v) =>
          isWholesaler
            ? ((v.international_wholesale_price !== undefined && v.international_wholesale_price !== null && v.international_wholesale_price !== '' && Number(v.international_wholesale_price) > 0) ||
               (v.international_price !== undefined && v.international_price !== null && v.international_price !== '' && Number(v.international_price) > 0))
            : (v.international_price !== undefined && v.international_price !== null && v.international_price !== '' && Number(v.international_price) > 0)
        )
      )
    : inStockProducts;

  const filteredProducts = activeCategory
    ? visibleProducts.filter((p) => p.categories?.some((c) => c.id === activeCategory) ?? false)
    : visibleProducts;

  const containerRef = useRef<HTMLDivElement>(null);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  const checkOverflow = () => {
    if (!containerRef.current) return;
    const { scrollWidth, clientWidth, scrollLeft } = containerRef.current;
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
    setShowLeftArrow(scrollLeft > 0);
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const scrollAmount = 200;
    containerRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", checkOverflow);
    return () => container.removeEventListener("scroll", checkOverflow);
  }, []);

  if (!products || products.length === 0) return <p></p>;

  return (
    <div className="w-full relative group/section">
      {/* header and category */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
        {/* title */}
        <h2 className="text-xl text-primary font-bold shrink-0">
          Popular Products
        </h2>

        {/* scrollbar for category row */}
        <div className="relative flex items-center w-full md:w-2/3 px-7">
          {/* left arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scrollCategories("left")}
              className="absolute left-0 z-10 h-full text-primary rounded-full flex items-center cursor-pointer transition-transform hover:scale-110"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* category container */}
          <div
            ref={containerRef}
            className="flex gap-2 overflow-x-auto md:overflow-x-hidden whitespace-nowrap w-full scrollbar-hide py-1"
          >
            {/* all btn */}
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full cursor-pointer text-sm transition-all duration-300 ${
                activeCategory === null
                  ? "text-white bg-primary shadow-md"
                  : "text-gray-500 hover:bg-gray-100 border border-transparent"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full cursor-pointer text-sm transition-all duration-300 ${
                  activeCategory === category.id
                    ? "text-white bg-primary font-medium shadow-md"
                    : "text-gray-500 hover:bg-gray-100 border border-transparent"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* right arrow */}
          {showRightArrow && (
            <button
              onClick={() => scrollCategories("right")}
              className="absolute right-0 z-10 h-full flex items-center text-primary cursor-pointer transition-transform hover:scale-110"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      {filteredProducts.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
          <ShoppingBag
            size={56}
            className="mb-4 text-primary/40"
          />
          <h3 className="text-xl font-bold text-gray-800">
            Coming Soon!
          </h3>
          <p className="text-gray-500 mt-2 max-w-xs">
            We're currently restocking this category. Please check back later!
          </p>
        </div>
      ) : (
        <div className="relative px-0">
          {/* Custom Navigation */}
          <button 
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 bg-white shadow-lg border border-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-primary opacity-0 group-hover/section:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white pointer-events-auto popular-prev"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 bg-white shadow-lg border border-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-primary opacity-0 group-hover/section:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white pointer-events-auto popular-next"
          >
            <ChevronRight size={24} />
          </button>

          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              prevEl: ".popular-prev",
              nextEl: ".popular-next",
            }}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            spaceBetween={20}
            slidesPerView={1.2}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              768: { slidesPerView: 2.5 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="!py-4"
          >
            {filteredProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};

export default PopularProducts;
