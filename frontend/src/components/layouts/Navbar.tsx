"use client";

import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import Link from "next/link";

import {
  Menu,
  Search,
  ShoppingCart,
  User,
  Globe,
  X,
  Phone,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useCartStore } from "@/src/store/use-cart-store";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface NavbarProps {
  categories: Category[];
  contactPhone: string;
  logo?: string | null;
}

export default function Navbar({
  categories = [],
  contactPhone,
  logo,
}: NavbarProps) {
  const cartCount = useCartStore((s) => s.itemCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const categoryRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = categoryRef.current;

    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    setCanScrollLeft(scrollLeft > 0);

    // safer for fractional browser values
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  }, []);

  const scrollRight = () => {
    categoryRef.current?.scrollBy({
      left: 200,
      behavior: "smooth",
    });
  };

  const scrollLeft = () => {
    categoryRef.current?.scrollBy({
      left: -200,
      behavior: "smooth",
    });
  };

  // Initial layout check
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      checkScroll();
    });

    return () => cancelAnimationFrame(raf);
  }, [categories, checkScroll]);

  // Fix for Next.js back navigation / restored scroll
  useEffect(() => {
    const el = categoryRef.current;

    if (!el) return;

    const update = () => {
      requestAnimationFrame(() => {
        checkScroll();
      });
    };

    update();

    el.addEventListener("scroll", update);

    window.addEventListener("pageshow", update);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("pageshow", update);
    };
  }, [checkScroll]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);

    return () => {
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  return (
    <header className="w-full font-sans">
      {/* desktop */}

      <div className="hidden md:block">
        {/* top bar */}
        <div className="h-8 bg-white border-b text-[12px] text-gray-600">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <span>100% Secure delivery</span>

            <div className="flex items-center gap-6">
              <span>Need help? Call Us: {contactPhone}</span>

              <div className="flex items-center gap-1">
                <User size={14} />
                <span>Retailer</span>
              </div>

              <div className="flex items-center gap-1">
                <Globe size={14} />
                <span>NP</span>
              </div>
            </div>
          </div>
        </div>

        {/* main bar */}
        <div className="bg-primary">
          <div className="max-w-7xl mx-auto px-4 h-16 grid grid-cols-3 items-center">
            {/* logo */}
            <div>
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="text-primary font-bold text-lg">LOGO</div>
              )}
            </div>

{/* search */}
            <div className="justify-self-center w-full flex justify-center">
              <div className="relative w-[450px]">
                <input
                  type="text"
                  placeholder="Search Item category ..."
                  className="w-full h-8 text-sm rounded bg-white/10 border border-white/30 pl-12 pr-4 text-white placeholder:text-white/70 outline-none"
                />

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
                />
              </div>
            </div>

            {/* cart */}
            <Link
              href="/cart"
              className="justify-self-end relative text-white cursor-pointer"
              aria-label="View cart"
            >
              <ShoppingCart size={24} />

              {isMounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* category bar */}
        <div className="h-11 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
            {/* ALL CATEGORY */}
            <button className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              <Menu size={18} />
              <span>All Category</span>
            </button>

            {/* left button */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="p-1 text-gray-600 hover:text-primary cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {/* category list */}
            <nav
              ref={categoryRef}
              className="flex items-center gap-6 text-[13px] text-gray-700 overflow-x-auto scrollbar-hide flex-1 scroll-smooth"
            >
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="whitespace-nowrap hover:text-primary transition-colors"
                >
                  {cat.name}
                </a>
              ))}
            </nav>

            {/* right button */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="p-1 text-gray-600 hover:text-primary cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* mobile */}

      <div className="md:hidden bg-white border-b">
        {/* top row */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* logo */}
          <div className="text-primary font-bold text-xl">LOGO</div>

          
          <div className="flex items-center gap-4">
            {/* cart */}
            <Link href="/cart" className="relative" aria-label="View cart">
              <ShoppingCart size={22} className="text-gray-700" />

              {isMounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* menu button */}
            <button onClick={() => setMenuOpen(true)}>
              <Menu size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Item category ..."
              className="w-full h-11 rounded-full border border-primary/40 pl-4 pr-24 text-sm outline-none"
            />

            <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary text-white text-sm px-4 h-9 rounded-full flex items-center gap-1">
              <Search size={16} />
              Search
            </button>
          </div>
        </div>
      </div>

      

      {/* overplay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 md:hidden flex flex-col ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 h-14 border-b shrink-0">
          <h2 className="font-semibold text-lg">Menu</h2>

          <button onClick={() => setMenuOpen(false)}>
            <X size={22} />
          </button>
        </div>

        {/* contact */}
        <div className="p-4 border-b space-y-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone size={16} />
            <span>+977 9874563210</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User size={16} />
            <span>Retailer</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Globe size={16} />
            <span>NP</span>
          </div>
        </div>

        {/* category title */}
        <div className="px-4 pt-5 pb-3 border-b shrink-0">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">
            Categories
          </h3>
        </div>

        {/* scrollable category list */}
        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="px-4 py-3 border-b text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
