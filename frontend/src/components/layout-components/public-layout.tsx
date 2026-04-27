import * as React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col font-poppins">
      <Navbar />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
