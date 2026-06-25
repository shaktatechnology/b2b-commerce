'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Spinner } from '@/src/components/ui/spinner';
import { AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import { loginApi } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Phone Number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

/* Keywords that indicate a pending-approval block from the backend */
const PENDING_KEYWORDS = [
  'not approved',
  'pending approval',
  'pending',
  'account not yet approved',
  'awaiting approval',
  'under review',
  'not yet active',
];

function isPendingError(message: string): boolean {
  const lower = message.toLowerCase();
  return PENDING_KEYWORDS.some((kw) => lower.includes(kw));
}

/* ─── Pending-Approval Banner ─── */
function PendingBanner() {
  return (
    <motion.div
      key="pending-banner"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Clock className="size-5 text-amber-500" />
        </div>
        <div>
          <p className="font-black text-amber-700 text-sm mb-1">Account Pending Approval</p>
          <p className="text-amber-600 text-xs leading-relaxed">
            Your wholesaler account is currently under review by our admin team.
            You'll be able to log in once your account has been approved.
          </p>
          <p className="text-amber-500 text-[11px] mt-2 font-medium">
            Check your email for updates, or contact support if you have any questions.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function LoginForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
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
    setIsPending(false);
    try {
      const res = await loginApi(data.email, data.password);
      setUser(res.data);

      const role = res.data?.role;
      if (redirectTo && redirectTo.startsWith('/')) {
        window.location.href = redirectTo;
      } else if (role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (role === 'wholeseller' || role === 'wholesaler') {
        window.location.href = '/wholeseller';
      } else {
        window.location.href = '/';
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';

      if (isPendingError(message)) {
        setIsPending(true);
        setErrorMessage(null);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* Pending approval banner */}
        {isPending && <PendingBanner key="pending" />}

        {/* Generic error */}
        {errorMessage && !isPending && (
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
          {/* Email */}
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

          {/* Password */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="password"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="submit"
            className="h-[56px] px-12 rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-medium transition-all disabled:opacity-70 active:scale-[0.98] cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" className="border-white" /> : 'Log In'}
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