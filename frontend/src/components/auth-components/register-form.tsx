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
import { AlertCircle, User, Building2 } from 'lucide-react';
import { apiFetch } from '@/src/lib/api';
import { setAuthCookie } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';

/* ─────────────────────────────── Schemas ─────────────────────────────── */

const baseSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Please enter a valid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

const wholesalerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Please enter a valid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
    phone: z.string().max(25).optional().or(z.literal('')),
    company_name: z.string().max(255).optional().or(z.literal('')),
    address: z.string().max(1000).optional().or(z.literal('')),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

type CustomerValues = z.infer<typeof baseSchema>;
type WholesalerValues = z.infer<typeof wholesalerSchema>;
type RegisterValues = CustomerValues | WholesalerValues;

/* ─────────────────────────────── API types ────────────────────────────── */

interface RegisterResponse {
  message: string;
  data: {
    user: {
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
  };
}

/* ──────────────────────────── Shared styles ───────────────────────────── */

const fieldClass =
  'h-11 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none';

/* ═══════════════════════════ RegisterForm ════════════════════════════════ */

export function RegisterForm() {
  const [role, setRole] = React.useState<'customer' | 'wholesaler'>('customer');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const setUser = useAppStore((s) => s.setUser);

  /* ── Customer form ── */
  const customerForm = useForm<CustomerValues>({
    resolver: zodResolver(baseSchema),
  });

  /* ── Wholesaler form ── */
  const wholesalerForm = useForm<WholesalerValues>({
    resolver: zodResolver(wholesalerSchema),
  });

  /* ── Submission ── */
  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload: Record<string, string> = {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role,
      };

      if (role === 'wholesaler') {
        const w = data as WholesalerValues;
        if (w.phone) payload.phone = w.phone;
        if (w.company_name) payload.company_name = w.company_name;
        if (w.address) payload.address = w.address;
      }

      const res = await apiFetch<RegisterResponse>('/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setAuthCookie(res.data.access_token);
      setUser(res.data.user);

      const userRole = res.data.user?.role;
      if (redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo);
      } else if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (userRole === 'wholeseller' || userRole === 'wholesaler') {
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

  /* ── Role toggle ── */
  const handleRoleChange = (newRole: 'customer' | 'wholesaler') => {
    setRole(newRole);
    setErrorMessage(null);
    customerForm.clearErrors();
    wholesalerForm.clearErrors();
  };

  /* ── Shared password fields (used in both forms) ── */
  const isCustomer = role === 'customer';
  const { register: regC, handleSubmit: handleC, formState: { errors: errC } } = customerForm;
  const { register: regW, handleSubmit: handleW, formState: { errors: errW } } = wholesalerForm;

  const reg = isCustomer ? regC : regW;
  const handleForm = isCustomer
    ? handleC(onSubmit as (d: CustomerValues) => void)
    : handleW(onSubmit as (d: WholesalerValues) => void);
  const err = isCustomer ? errC : errW;

  return (
    <div className="w-full">
      {/* ── Role selector ── */}
      <div className="flex gap-3 mb-6 p-1 bg-zinc-100 rounded-xl">
        <button
          type="button"
          id="role-customer-btn"
          onClick={() => handleRoleChange('customer')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold
            transition-all duration-200 cursor-pointer
            ${isCustomer
              ? 'bg-white text-[#966FD6] shadow-sm border border-[#966FD6]/20'
              : 'text-zinc-500 hover:text-zinc-700'
            }
          `}
          style={{ fontFamily: 'Lato, sans-serif' }}
        >
          <User size={16} />
          Customer
        </button>
        <button
          type="button"
          id="role-wholesaler-btn"
          onClick={() => handleRoleChange('wholesaler')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold
            transition-all duration-200 cursor-pointer
            ${!isCustomer
              ? 'bg-white text-[#966FD6] shadow-sm border border-[#966FD6]/20'
              : 'text-zinc-500 hover:text-zinc-700'
            }
          `}
          style={{ fontFamily: 'Lato, sans-serif' }}
        >
          <Building2 size={16} />
          Wholesaler
        </button>
      </div>

      {/* ── Error banner ── */}
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

      {/* ── Form ── */}
      <AnimatePresence mode="wait">
        <motion.form
          key={role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleForm}
          className="space-y-5"
        >
          {/* Name */}
          <div className="space-y-1">
            <Input
              id="name"
              placeholder="Full Name"
              type="text"
              autoComplete="name"
              disabled={isLoading}
              className={fieldClass}
              {...reg('name')}
            />
            {err.name && <p className="text-xs text-destructive">{err.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Input
              id="email"
              placeholder="Email Address"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              className={fieldClass}
              {...reg('email')}
            />
            {err.email && <p className="text-xs text-destructive">{err.email.message}</p>}
          </div>

          {/* ── Wholesaler-only fields ── */}
          {!isCustomer && (
            <>
              {/* Phone */}
              <div className="space-y-1">
                <Input
                  id="phone"
                  placeholder="Phone Number (Optional)"
                  type="tel"
                  autoComplete="tel"
                  disabled={isLoading}
                  className={fieldClass}
                  {...regW('phone')}
                />
                {errW.phone && <p className="text-xs text-destructive">{errW.phone.message}</p>}
              </div>

              {/* Company Name */}
              <div className="space-y-1">
                <Input
                  id="company_name"
                  placeholder="Company Name (Optional)"
                  type="text"
                  disabled={isLoading}
                  className={fieldClass}
                  {...regW('company_name')}
                />
                {errW.company_name && (
                  <p className="text-xs text-destructive">{errW.company_name.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <Input
                  id="address"
                  placeholder="Business Address (Optional)"
                  type="text"
                  disabled={isLoading}
                  className={fieldClass}
                  {...regW('address')}
                />
                {errW.address && (
                  <p className="text-xs text-destructive">{errW.address.message}</p>
                )}
              </div>
            </>
          )}

          {/* Password */}
          <div className="space-y-1">
            <Input
              id="password"
              placeholder="Password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              className={fieldClass}
              {...reg('password')}
            />
            {err.password && <p className="text-xs text-destructive">{err.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Input
              id="password_confirmation"
              placeholder="Confirm Password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              className={fieldClass}
              {...reg('password_confirmation')}
            />
            {err.password_confirmation && (
              <p className="text-xs text-destructive">{err.password_confirmation.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            id="register-submit-btn"
            className="w-full h-[50px] rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-medium transition-all disabled:opacity-70 active:scale-[0.98] cursor-pointer mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner size="sm" className="border-white" />
            ) : isCustomer ? (
              'Create Customer Account'
            ) : (
              'Create Wholesaler Account'
            )}
          </Button>
        </motion.form>
      </AnimatePresence>

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
        id="google-signup-btn"
        className="w-full h-[50px] flex items-center justify-center gap-3 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-base font-medium transition-all active:scale-[0.98] cursor-pointer"
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
          <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
          <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.314 0-9.823-3.614-11.283-8.562l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
          <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C42.012 34.245 44 29.453 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
        </svg>
        Sign up with Google
      </button>
    </div>
  );
}