import Navbar from '@/src/components/layouts/Navbar';
import Footer from '@/src/components/layouts/Footer';
import type { StorefrontCategory, StorefrontSettings } from '@/src/types/storefront';

interface StorefrontLayoutProps {
  categories: StorefrontCategory[];
  settings: StorefrontSettings;
  children: React.ReactNode;
}

export default function StorefrontLayout({
  categories,
  settings,
  children,
}: StorefrontLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
        categories={categories}
        contactPhone={settings.contactPhone}
        logo={settings.logo}
      />
      <main className="flex-1">{children}</main>
      <Footer
        logo={settings.logo}
        metaDescription={settings.metaDescription}
        socialLinks={settings.socialLinks}
        categories={categories}
      />
    </div>
  );
}
