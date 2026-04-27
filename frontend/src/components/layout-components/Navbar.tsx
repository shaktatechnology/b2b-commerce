'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { ThemeToggle } from '../navigation-components/theme-toggle';
import { getSettingsByGroup } from '@/src/lib/settings';

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
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    getSettingsByGroup('general')
      .then((res) => setSettings(res.data))
      .catch((err) => console.error('Failed to fetch navbar settings:', err));

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const siteName = settings.site_name || 'Shakta Starter Kit';

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-8',
        scrolled 
          ? 'h-20 bg-background/80 backdrop-blur-md shadow-sm border-b' 
          : 'h-24 bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {siteName}
          </span>
        </Link>

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

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button className="rounded-xl px-6 h-11 hidden sm:flex">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
