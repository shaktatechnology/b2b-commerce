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

export function LoginForm() {
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
        router.push('/wholeseller');
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
    <div className="w-full">
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
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
          <div className="space-y-2">
            <Input
              id="email"
              placeholder="Email or Phone Number"
              type="text"
              autoComplete="email"
              disabled={isLoading}
              className="h-12 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Input
              id="password"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              className="h-12 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="submit"
            className="h-[56px] px-12 rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-medium transition-all disabled:opacity-70 active:scale-[0.98] cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner size="sm" className="border-white" />
            ) : (
              'Log In'
            )}
          </Button>

          <a
            href="/forgot-password"
            className="text-[#966FD6] text-base font-normal hover:underline underline-offset-4"
          >
            Forget Password?
          </a>
        </div>
      </form>
    </div>
  );
}