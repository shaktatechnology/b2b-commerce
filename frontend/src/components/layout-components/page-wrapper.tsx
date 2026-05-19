'use client';

import { motion } from 'framer-motion';
import { cn } from '@/src/lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function PageWrapper({ children, className, delay = 0 }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, description, children, className }: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2', className)}>
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-black">{title}</h1>
        {description && <p className="text-black/60 font-medium text-lg">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
