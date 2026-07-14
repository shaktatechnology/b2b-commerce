'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Spinner } from '@/src/components/ui/spinner';
import { AlertCircle } from 'lucide-react';
import { loginApi } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Phone Number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function WholesellerLoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginApi(data.email, data.password);
      setUser(res.data);

      const role = res.data?.role;
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'wholeseller' || role === 'wholesaler') {
        router.push('/');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Wholeseller Log In</h1>
        <p className="text-sm text-zinc-500">
          Access your wholesale account and priority prices.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg bg-destructive/5 px-4 py-3 text-sm text-destructive border border-destructive/10"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Input
            id="email"
            placeholder="Email or Phone Number"
            type="text"
            autoComplete="email"
            disabled={isLoading}
            className="h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all text-sm"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Input
            id="password"
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            disabled={isLoading}
            className="h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all text-sm"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-lg bg-[#966FD6] hover:bg-[#855fc4] text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" className="border-white" /> : 'Log In'}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-xs text-zinc-400">
          Want to join our Wholesale Program?{' '}
          <a href="/wholeseller" className="text-[#966FD6] font-semibold hover:underline">
            Apply Here
          </a>
        </p>
        <div>
          <a href="/login" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors font-medium">
            Standard Login
          </a>
        </div>
      </div>
    </div>
  );
}
