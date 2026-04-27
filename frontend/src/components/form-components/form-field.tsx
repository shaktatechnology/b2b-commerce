'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2 w-full', className)} {...props}>
      {label && (
        <label className="text-sm font-semibold tracking-tight text-foreground/80 flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({ title, description, children, className }: { 
  title: string; 
  description?: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h4 className="text-lg font-bold tracking-tight">{title}</h4>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-6">
        {children}
      </div>
    </div>
  );
}
