'use client';

import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Bell, Menu, Search, User } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { ThemeToggle } from '../navigation-components/theme-toggle';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/src/store/use-app-store';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const user = useAppStore((s) => s.user);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-lato text-black/80">
      <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="size-6" />
            </Button>
            
            {/* Global Search Removed */}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme and Notifications Removed */}
            <div className="h-8 w-[1px] bg-border mx-1 md:mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-black/90">{user?.name ?? 'Admin User'}</p>
                <p className="text-xs text-zinc-500">{user?.email ?? 'admin@example.com'}</p>
              </div>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10 md:h-11 md:w-11 border-zinc-200 hover:border-[#966FD6] hover:bg-[#966FD6]/5 transition-all shadow-sm">
                <User className="size-5 text-[#966FD6]" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
