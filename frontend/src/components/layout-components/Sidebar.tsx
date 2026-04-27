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
  { name: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { name: 'Users', icon: Users, href: '/admin/users' },
  { name: 'Projects', icon: Layers, href: '/admin/projects' },
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
        'sticky top-0 z-40 flex flex-col h-screen border-r bg-card shadow-lg font-poppins transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-72',
        className
      )}
    >
      <div className="flex items-center justify-between h-20 px-6 border-b">
        {!isCollapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Shakta Admin
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto rounded-full hover:bg-muted"
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
                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn('size-5', isActive ? 'text-white' : 'group-hover:text-primary')} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto space-y-2">
        {/* <Link
          href="/admin/notifications"
          className={cn(
            'flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all'
          )}
        >
          <Bell className="size-5" />
          {!isCollapsed && <span className="font-medium">Notifications</span>}
        </Link> */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all disabled:opacity-60'
          )}
        >
          {isLoggingOut ? (
            <Spinner size="sm" className="size-5 border-destructive" />
          ) : (
            <LogOut className="size-5" />
          )}
          {!isCollapsed && (
            <span className="font-medium">{isLoggingOut ? 'Logging out…' : 'Log out'}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
