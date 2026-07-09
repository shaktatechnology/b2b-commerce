'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Spinner } from '@/src/components/ui/spinner';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { forgotPasswordApi } from '@/src/lib/auth';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await forgotPasswordApi(data.email);
      setSuccessMessage(res.message || 'Reset link sent! Please check your inbox.');
      reset();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* Success state */}
        {successMessage && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="size-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-emerald-700 text-sm mb-1">Email Sent!</p>
                <p className="text-emerald-600 text-xs leading-relaxed">{successMessage}</p>
                <p className="text-emerald-500 text-[11px] mt-2 font-medium">
                  Didn't receive it? Check your spam folder or try again.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {errorMessage && !successMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg bg-destructive/5 px-4 py-3 text-sm text-destructive mb-8 border border-destructive/10"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <div className="space-y-8">
          {/* Email field */}
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
              <Input
                id="forgot-email"
                placeholder="Enter your email address"
                type="email"
                autoComplete="email"
                disabled={isLoading || !!successMessage}
                className="h-12 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none pl-7 pr-0 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-[56px] rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-medium transition-all disabled:opacity-70 active:scale-[0.98] cursor-pointer"
          disabled={isLoading || !!successMessage}
        >
          {isLoading ? <Spinner size="sm" className="border-white" /> : 'Send Reset Link'}
        </Button>
      </form>
    </div>
  );
}
