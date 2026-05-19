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
import { apiFetch } from '@/src/lib/api';
import { setAuthCookie } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    company_name: z.string().min(1, 'Company name is required'),
    address: z.string().min(1, 'Address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterResponse {
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role?: string;
  };
  access_token: string;
  token_type: string;
}

const fieldClass =
  'h-11 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none';

export function RegisterForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch<RegisterResponse>('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          company_name: data.company_name,
          address: data.address,
          password: data.password,
          password_confirmation: data.password_confirmation,
          role: 'wholesaler',
        }),
      });
      setAuthCookie(res.access_token);
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
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
            className="flex items-center gap-2 rounded-lg bg-destructive/5 px-4 py-3 text-sm text-destructive mb-6 border border-destructive/10"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div className="space-y-1">
          <Input id="name" placeholder="Name" type="text" autoComplete="name" disabled={isLoading} className={fieldClass} {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Input id="email" placeholder="Email" type="email" autoComplete="email" disabled={isLoading} className={fieldClass} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Input id="phone" placeholder="Phone Number (Optional)" type="tel" autoComplete="tel" disabled={isLoading} className={fieldClass} {...register('phone')} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        {/* Company */}
        <div className="space-y-1">
          <Input id="company_name" placeholder="Company Name" type="text" disabled={isLoading} className={fieldClass} {...register('company_name')} />
          {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
        </div>

        {/* Address */}
        <div className="space-y-1">
          <Input id="address" placeholder="Address" type="text" disabled={isLoading} className={fieldClass} {...register('address')} />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Input id="password" placeholder="Password" type="password" autoComplete="new-password" disabled={isLoading} className={fieldClass} {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <Input id="password_confirmation" placeholder="Confirm Password" type="password" autoComplete="new-password" disabled={isLoading} className={fieldClass} {...register('password_confirmation')} />
          {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-[50px] rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-medium transition-all disabled:opacity-70 active:scale-[0.98] cursor-pointer mt-2"
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" className="border-white" /> : 'Create Account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-zinc-400">or</span>
        </div>
      </div>

      {/* Google */}
      <button
        type="button"
        className="w-full h-[50px] flex items-center justify-center gap-3 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-base font-medium transition-all active:scale-[0.98] cursor-pointer"
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
          <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
          <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.314 0-9.823-3.614-11.283-8.562l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
          <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C42.012 34.245 44 29.453 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
        </svg>
        Sign up with Google
      </button>
    </div>
  );
}