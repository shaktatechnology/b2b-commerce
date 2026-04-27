'use client';

import { Spinner } from '@/src/components/ui/spinner';
import { motion } from 'framer-motion';

export function FullscreenLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <Spinner size="lg" className="border-t-primary border-4" />
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        </div>
        <p className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {label}
        </p>
      </motion.div>
    </div>
  );
}
