'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { cn } from '@/src/lib/utils';
import { ThemeToggle } from '../navigation-components/theme-toggle';
import { getSettingsByGroup } from '@/src/lib/settings';
import { getAuthToken, logoutApi, fetchProfile } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';
import type { AuthUser } from '@/src/types';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Projects', href: '/projects' },
  { name: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [settings, setSettings] = React.useState<Record<string, string | null>>({});
  const [profileUser, setProfileUser] = React.useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const storeUser = useAppStore((s) => s.user);
  const storeLogout = useAppStore((s) => s.logout);

  // Fetch settings
  React.useEffect(() => {
    getSettingsByGroup('general')
      .then((res) => setSettings(res.data))
      .catch((err) => console.error('Failed to fetch navbar settings:', err));
  }, []);

  // Scroll handler
  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch profile on mount & when store user changes
  React.useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchProfile(token)
        .then((user) => setProfileUser(user))
        .catch(() => setProfileUser(null));
    } else {
      setProfileUser(null);
    }
  }, [storeUser]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi();
      storeLogout();
      setProfileUser(null);
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const siteName = settings.site_name || 'B2B Starter Kit';
  const isLoggedIn = !!profileUser;

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-8',
        scrolled
          ? 'h-16 sm:h-20 bg-background/80 backdrop-blur-md shadow-sm border-b'
          : 'h-20 sm:h-24 bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {siteName}
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />

          {/* --- Auth: Profile Dropdown or Login Button --- */}
          {isLoggedIn ? (
            <div className="relative group">
              <button
                id="profile-menu-trigger"
                className={cn(
                  'flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all duration-200 cursor-pointer',
                  'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'border border-transparent hover:border-border'
                )}
                onClick={() => router.push('/account')}
              >
                {/* Avatar circle */}
                <span
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all',
                    'bg-gradient-to-br from-[#966FD6] to-[#7c52c9] text-white shadow-md shadow-primary/20'
                  )}
                >
                  {getInitials(profileUser.name)}
                </span>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                  {profileUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:rotate-180" />
              </button>

              {/* Hover Dropdown Content */}
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-[60]">
                <div className="w-56 p-1.5 bg-background border rounded-2xl shadow-xl shadow-black/10">
                  {/* User info header */}
                  <div className="px-3 py-3 border-b">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold leading-none text-foreground">
                        {profileUser.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {profileUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="py-1">
                    {/* Account Link */}
                    <button
                      id="hover-account"
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-zinc-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all cursor-pointer"
                      onClick={() => router.push('/account')}
                    >
                      <User className="h-4 w-4" />
                      <span>Account</span>
                    </button>

                    {/* Logout */}
                    <button
                      id="hover-logout"
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      disabled={isLoggingOut}
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login">
              <Button
                id="navbar-login-btn"
                className="rounded-xl px-6 h-11 hidden sm:flex bg-[#966FD6] hover:bg-[#7d5bbf] text-white shadow-lg shadow-[#966FD6]/20 font-black text-xs uppercase tracking-widest"
              >
                Login
              </Button>
              {/* Mobile: icon-only login */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 sm:hidden"
                aria-label="Login"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-sm font-medium py-3 px-4 rounded-lg transition-colors',
                  pathname === item.href
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
