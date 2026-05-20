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
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { logoutApi } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';
import { Spinner } from '@/src/components/ui/spinner';

interface SidebarProps {
  className?: string;
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'Categories', icon: Layers, href: '/admin/categories' },
  { name: 'Products', icon: Globe, href: '/admin/products' },
  { name: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
  { name: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { name: 'Users', icon: Users, href: '/admin/users' },
  { name: 'Settings', icon: Settings, href: '/admin/settings' },
];

export function Sidebar({ className }: SidebarProps) {
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
    <aside
      className={cn(
        'sticky top-0 z-40 flex flex-col h-screen bg-white text-black/80 border-r border-zinc-100 shadow-xl font-lato transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-72',
        className
      )}
    >
      <div className="flex items-center justify-between h-20 px-6 border-b border-zinc-50">
        {!isCollapsed && (
          <span className="text-2xl font-black tracking-tighter text-black">
            SHAKTA<span className="text-blue-500">.</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto rounded-full hover:bg-zinc-100 text-zinc-400"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-500 text-white shadow-blue-200/50 shadow-lg'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-black'
              )}
            >
              <Icon className={cn('size-5 transition-transform duration-200 group-hover:scale-110', isActive ? 'text-white' : 'text-zinc-400 group-hover:text-black')} />
              {!isCollapsed && <span className="font-bold tracking-wide">{item.name}</span>}
              {isActive && !isCollapsed && (
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
          {!isCollapsed && (
            <span className="font-bold tracking-wide">{isLoggingOut ? 'Logging out…' : 'Log out'}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
