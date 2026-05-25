"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, ShoppingBag } from "lucide-react";
import ProductCard from "../cards/ProductCard";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  retail_price: string;
}

interface Product {
  id: string;
  name: string;
  categories: Category[];
  variants: Variant[];
  image?: string;
  thumbnail?: string;
  image_url?: string;
  images: { url?: string; image_path?: string }[];
}

interface PopularProductsProps {
  products: Product[];
  categories: Category[];
}

const PopularProducts: React.FC<PopularProductsProps> = ({
  products,
  categories,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredProducts = activeCategory
    ? products.filter((p) => p.categories.some((c) => c.id === activeCategory))
    : products;

  const desktopProducts = filteredProducts.slice(0, 6);

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

  if (!products || products.length === 0) return <p>No products available.</p>;

  return (
    <div className="w-full relative">
      {/* header and category */}
      <div className="flex justify-between items-center mb-5">
        {/* title */}
        <h2 className="text-lg text-primary font-semibold ">
          Popular Products
        </h2>

        {/* scrollbar for category row */}
        <div className="relative flex items-center w-2/3 px-7">
          {/* left arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scrollCategories("left")}
              className="absolute left-0 z-10 h-full text-primary  rounded-full flex items-center cursor-pointer"
            >
              <ChevronLeft size={19} />
            </button>
          )}

          {/* category container */}
          <div
            ref={containerRef}
            className="flex gap-2 overflow-x-hidden whitespace-nowrap w-full"
          >
            {/* all btn */}
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-3 py-1 rounded-full cursor-pointer${
                activeCategory === null
                  ? " text-primary  bg-gray-200"
                  : "text-gray-500 hover:bg-gray-200"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 px-3 py-1 rounded-full cursor-pointer ${
                  activeCategory === category.id
                    ? "text-primary font-bold bg-gray-200"
                    : "text-gray-500 hover:bg-gray-200"
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
              className="absolute right-0 z-10 h-full  flex items-center text-primary cursor-pointer"
            >
              <ChevronRight size={19} />
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      {filteredProducts.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-14 text-center border rounded-xl bg-gray-50">
          <ShoppingBag
            size={48}
            className=" mb-3 animate-bounce text-primary"
          />

          <h3 className="text-lg font-semibold text-primary">
            Products will be added soon
          </h3>

          <p className="text-sm  mt-1   text-primary">
            No products available in this category yet.
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP SLIDER */}
          <div className="hidden md:flex gap-5 overflow-x-auto scroll-smooth scrollbar-hide">
            {desktopProducts.map((product) => (
              <div key={product.id} className="w-[280px] flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* MOBILE GRID */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {filteredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PopularProducts;
