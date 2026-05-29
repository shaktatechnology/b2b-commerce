'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/src/store/use-cart-store';
import { useAppStore } from '@/src/store/use-app-store';
import { logoutApi } from '@/src/lib/auth';
import { getSettingsByGroup } from '@/src/lib/settings';

export function AccountNavbar() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const storeLogout = useAppStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.itemCount());

  const [isMounted, setIsMounted] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [logo, setLogo] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
    getSettingsByGroup('general')
      .then((res) => {
        if (res?.data?.logo_url) setLogo(res.data.logo_url as string);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi();
      storeLogout();
      router.push('/');
    } catch {
      /* ignore */
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full font-sans">
      {/* Purple main bar — matches storefront navbar */}
      <div className="bg-[#966FD6]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            {logo ? (
              <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="text-white font-bold text-lg">LOGO</div>
            )}
          </Link>

          {/* Right side: User + Cart */}
          <div className="flex items-center gap-6">
            {/* Auth: user dropdown or login */}
            {isMounted && user ? (
              <div className="relative group">
                <div className="flex items-center gap-2 cursor-pointer text-white/90 hover:text-white transition-colors py-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <User size={18} />
                  </div>
                  <span className="text-sm font-bold max-w-[100px] truncate hidden sm:block">
                    {user.name}
                  </span>
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform hidden sm:block" />
                </div>

                {/* Hover dropdown — only Logout */}
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-[100]">
                  <div className="w-52 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden p-1.5 ring-1 ring-black/5">
                    <div className="px-3 py-2.5 border-b border-gray-50 mb-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">
                        Signed in as
                      </p>
                      <p className="text-xs font-black text-zinc-800 truncate">{user.name}</p>
                    </div>
                    <button
                      id="account-nav-logout-btn"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all text-left disabled:opacity-60 cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/20 shadow-inner">
                  <User size={20} />
                </div>
                <span className="text-sm font-black uppercase tracking-tight hidden sm:block">
                  Login
                </span>
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              id="account-nav-cart-btn"
              className="relative text-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10"
              aria-label="View cart"
            >
              <ShoppingCart size={26} />
              {isMounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 font-bold border-2 border-[#966FD6] shadow-lg">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
