'use client';

import * as React from 'react';
import { getSettingsByGroup } from '@/src/lib/settings';
import { SocialLinks } from '../public-components/social-links';

export function Footer() {
  const [footerSettings, setFooterSettings] = React.useState<Record<string, string | null>>({});

  React.useEffect(() => {
    getSettingsByGroup('appearance')
      .then((res) => setFooterSettings(res.data))
      .catch((err) => console.error('Failed to fetch footer settings:', err));
  }, []);

  const footerText = footerSettings.footer_text || `© ${new Date().getFullYear()} B2B Starter Kit. All rights reserved.`;

  return (
    <footer className="bg-background border-t py-12 px-8 font-poppins">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            B2B Ecommerce
          </span>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            A modern, performant, and premium full-stack starter kit designed for rapid application development.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4">
          <SocialLinks />
          <p className="text-sm text-muted-foreground">
            {footerText}
          </p>
        </div>
      </div>
    </footer>
  );
}
