'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/src/lib/utils';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Users,
  Layers,
  LogOut,
  ShoppingCart,
  Bell,
  Globe,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { logoutApi } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';
import { Spinner } from '@/src/components/ui/spinner';

interface SidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'Categories', icon: Layers, href: '/admin/categories' },
  { name: 'Products', icon: Globe, href: '/admin/products' },
  { name: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
  { name: 'Payments', icon: CreditCard, href: '/admin/payments' },
  { name: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { name: 'Users', icon: Users, href: '/admin/users' },
  { name: 'Settings', icon: Settings, href: '/admin/settings' },
];

export function Sidebar({ className, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi();
    } finally {
      logout(); // Clear Zustand store
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-white text-black/80 border-r border-zinc-100 shadow-xl font-lato transition-all duration-300 ease-in-out lg:sticky lg:top-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-72',
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-zinc-50">
          {(!isCollapsed || isMobileOpen) && (
            <span className="text-2xl font-black tracking-tighter text-black">
              SHAKTA<span className="text-blue-500">.</span>
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto rounded-full hover:bg-zinc-100 text-zinc-400"
            onClick={() => (isMobileOpen ? setIsMobileOpen?.(false) : setIsCollapsed(!isCollapsed))}
          >
            {isMobileOpen ? (
              <ChevronLeft className="lg:hidden" />
            ) : isCollapsed ? (
              <ChevronRight />
            ) : (
              <ChevronLeft />
            )}
          </Button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen?.(false)}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative',
                  isActive
                    ? 'bg-[#966FD6] text-white shadow-[#966FD6]/30 shadow-lg'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-black'
                )}
              >
                <Icon
                  className={cn(
                    'size-5 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-white' : 'text-zinc-400 group-hover:text-black'
                  )}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="font-bold tracking-wide">{item.name}</span>
                )}
                {isActive && (!isCollapsed || isMobileOpen) && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/30" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-50 mt-auto space-y-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-60 group'
            )}
          >
            {isLoggingOut ? (
              <Spinner size="sm" className="size-5 border-zinc-400" />
            ) : (
              <LogOut className="size-5 transition-transform group-hover:-translate-x-1" />
            )}
            {(!isCollapsed || isMobileOpen) && (
              <span className="font-bold tracking-wide">
                {isLoggingOut ? 'Logging out…' : 'Log out'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
