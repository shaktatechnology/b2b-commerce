'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Spinner } from '@/src/components/ui/spinner';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { resetPasswordApi } from '@/src/lib/auth';

const schema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await resetPasswordApi({
        token: data.token,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setSuccessMessage(res.message || 'Password reset successfully! You can now log in.');
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
                <p className="font-bold text-emerald-700 text-sm mb-1">Password Reset!</p>
                <p className="text-emerald-600 text-xs leading-relaxed">{successMessage}</p>
              </div>
            </div>
          </motion.div>
        )}

        {errorMessage && !successMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg bg-destructive/5 px-4 py-3 text-sm text-destructive mb-6 border border-destructive/10"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!successMessage && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* Hidden token field */}
          <input type="hidden" {...register('token')} />

          <div className="space-y-8">
            {/* Email */}
            <div className="space-y-2">
              <Input
                id="reset-email"
                placeholder="Confirm your email address"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                className="h-12 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="reset-password"
                  placeholder="New password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="h-12 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 pr-10 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none"
                  {...register('password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="reset-password-confirm"
                  placeholder="Confirm new password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="h-12 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 pr-10 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none"
                  {...register('password_confirmation')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-xs text-destructive mt-1">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-[56px] rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-medium transition-all disabled:opacity-70 active:scale-[0.98] cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" className="border-white" /> : 'Reset Password'}
          </Button>
        </form>
      )}

      {/* Go to login after success */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Button
            asChild
            className="w-full h-[56px] rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-medium"
          >
            <a href="/login">Go to Login</a>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
