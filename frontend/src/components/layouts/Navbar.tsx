"use client";

import {  useEffect,  useState,  useRef,  useLayoutEffect,  useCallback,} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {  Menu,  Search,  ShoppingCart,  User,  Globe,  X,  Phone,  ChevronRight,  ChevronLeft,  ChevronDown,  LogOut} from "lucide-react";
import { useCartStore } from "@/src/store/use-cart-store";
import { useAppStore } from "@/src/store/use-app-store";
import { getAuthToken, fetchProfile, logoutApi } from "@/src/lib/auth";
import { cn } from "@/src/lib/utils";
import { getActiveCurrency } from "@/src/lib/product-utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | number | null;
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
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const clearUser = useAppStore((s) => s.logout);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currency, setCurrency] = useState<'NPR' | 'USD'>('NPR');

  useEffect(() => {
    setCurrency(getActiveCurrency());
    const handleCurrencyChange = () => setCurrency(getActiveCurrency());
    window.addEventListener('currency_changed', handleCurrencyChange);
    return () => window.removeEventListener('currency_changed', handleCurrencyChange);
  }, []);

  const handleCurrencyToggle = () => {
    const next = currency === 'NPR' ? 'USD' : 'NPR';
    localStorage.setItem('currency_preference', next);
    setCurrency(next);
    useCartStore.getState().syncCurrency(next);
    window.dispatchEvent(new Event('currency_changed'));
  };

  useEffect(() => {
    setIsMounted(true);
    
    // Check for existing session
    const token = getAuthToken();
    if (token && !user) {
      fetchProfile(token)
        .then(u => setUser(u))
        .catch(() => {});
    }
  }, [user, setUser]);

  const handleLogout = async () => {
    try {
      await logoutApi();
      clearUser();
      setMenuOpen(false);
      window.location.href = '/';
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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

            {/* cart & auth */}
            <div className="justify-self-end flex items-center gap-4">
              {/* Currency Toggle */}
              <button
                id="currency-toggle-btn"
                onClick={handleCurrencyToggle}
                title={`Switch to ${currency === 'NPR' ? 'USD ($)' : 'NPR (Rs.)'}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/20 hover:border-white transition-all duration-200 bg-white/10 text-white cursor-pointer"
              >
                <span className={cn(currency === 'NPR' ? 'text-white font-extrabold font-black' : 'text-white/65 font-normal opacity-60')}>Rs.</span>
                <span className="text-white/35">|</span>
                <span className={cn(currency === 'USD' ? 'text-white font-extrabold font-black' : 'text-white/65 font-normal opacity-60')}>$</span>
              </button>

              <div className="text-white duration-200 hover:scale-105">
              </div>

              {/* Auth Logic */}
              {isMounted && user ? (
                <div className="relative group">
                  <div className="flex items-center gap-2 cursor-pointer text-white/90 hover:text-white transition-colors py-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                       <User size={18} />
                    </div>
                    <span className="text-sm font-bold max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                  </div>
                  
                  {/* Hover Dropdown */}
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-[100]">
                    <div className="w-52 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden p-1.5 ring-1 ring-black/5">
                      <div className="px-3 py-2.5 border-b border-gray-50 mb-1">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">User Identity</p>
                        <p className="text-xs font-black text-zinc-800 truncate">{user.name}</p>
                      </div>
                      <Link 
                        href="/account"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-primary rounded-lg transition-all"
                      >
                        <User size={16} className="text-zinc-400" />
                        <span>My Account</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all text-left"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/20 shadow-inner">
                    <User size={20} />
                  </div>
                  <span className="text-sm font-black uppercase tracking-tight">Login</span>
                </Link>
              )}

              <Link
                href="/cart"
                className="relative text-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10"
                aria-label="View cart"
              >
                <ShoppingCart size={26} />

                {isMounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 font-bold border-2 border-primary shadow-lg scale-90 group-hover:scale-100 transition-transform">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* category bar */}
        <div className="h-11 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
            {/* ALL CATEGORY */}
            <Link href="/">
            <button className="flex items-center cursor-pointer gap-2 text-sm font-medium whitespace-nowrap">
              <Menu size={18} />
              <span>All Category</span>
            </button>
            </Link>

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
              {categories
                .filter((cat) => !cat.parent_id)
                .map((cat) => (
                <a
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
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

          {isMounted && user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User size={16} />
                <span>{user.name}</span>
              </div>
              <Link 
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary"
              >
                <User size={16} />
                <span>Account</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-500 font-bold"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <User size={16} />
              <span>Login</span>
            </Link>
          )}
          <div className="flex items-center justify-between border-t pt-4 mt-2">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-gray-500" />
              <button
                onClick={handleCurrencyToggle}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-zinc-200 text-zinc-700 bg-background cursor-pointer"
              >
                <span className={cn(currency === 'NPR' ? 'text-primary font-bold' : 'text-zinc-400 font-normal')}>Rs.</span>
                <span className="text-zinc-300">|</span>
                <span className={cn(currency === 'USD' ? 'text-primary font-bold' : 'text-zinc-400 font-normal')}>$</span>
              </button>
            </div>
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
            {categories
              .filter((cat) => !cat.parent_id)
              .map((cat) => (
              <a
                key={cat.id}
                href={`/products?category=${cat.slug}`}
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
