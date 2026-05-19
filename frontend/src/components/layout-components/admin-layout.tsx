'use client';

import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Bell, Search, User } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { ThemeToggle } from '../navigation-components/theme-toggle';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/src/store/use-app-store';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const user = useAppStore((s) => s.user);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-lato text-black/80">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-20 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md bg-white/90">
          <div className="relative w-96 max-w-md hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search anything..."
              className="pl-10 bg-zinc-100 border-none focus-visible:ring-[#966FD6]/30 h-10 rounded-full text-black/80 placeholder:text-zinc-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="size-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </Button>
            <div className="h-8 w-[1px] bg-border mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-black/90">{user?.name ?? 'Admin User'}</p>
                <p className="text-xs text-zinc-500">{user?.email ?? 'admin@example.com'}</p>
              </div>
              <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-zinc-200 hover:border-[#966FD6] hover:bg-[#966FD6]/5 transition-all shadow-sm">
                <User className="size-5 text-[#966FD6]" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
