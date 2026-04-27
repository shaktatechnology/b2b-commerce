'use client';

import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 font-poppins">
      <div className="text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-[12rem] font-black text-primary/10 leading-none select-none">
            404
          </h1>
          <div className="relative -mt-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Oops! Page not found.
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto leading-relaxed">
              It seems like you've moved into a territory that doesn't exist. Let's get you back to safety.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => window.history.back()}
                variant="outline" 
                size="lg" 
                className="h-14 px-8 rounded-full gap-2 text-lg hover:bg-muted/50 transition-colors w-full sm:w-auto"
              >
                <ArrowLeft className="size-5" /> Go Back
              </Button>
              <Link href="/" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="h-14 px-8 rounded-full gap-2 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform w-full sm:w-auto"
                >
                  <Home className="size-5" /> Return Home
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-20" />
      </div>
    </div>
  );
}
