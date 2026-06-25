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
import {
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '@/src/lib/api';
import { setAuthCookie } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';
import { cn } from '@/src/lib/utils';
import { AuthUser } from '@/src/types';

/* ─────────────────── Schemas ─────────────────── */

const baseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Please enter a valid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(1, 'Please confirm your password'),
  phone: z.string().min(1, 'Phone number is required').max(25),
  company_name: z.string().max(255).optional().or(z.literal('')),
  address: z.string().max(1000).optional().or(z.literal('')),
});

const customerSchema = baseSchema.superRefine((data, ctx) => {
  if (data.password !== data.password_confirmation) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords don't match", path: ['password_confirmation'] });
  }
});

const wholesalerSchema = baseSchema.superRefine((data, ctx) => {
  if (data.password !== data.password_confirmation) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords don't match", path: ['password_confirmation'] });
  }
  if (!data.company_name?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company name is required for wholesaler accounts', path: ['company_name'] });
  }
  if (!data.address?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Business address is required for wholesaler accounts', path: ['address'] });
  }
});

type RegisterValues = z.infer<typeof baseSchema>;
type Role = 'customer' | 'wholesaler';

interface RegisterResponse {
  message: string;
  data: {
    user: AuthUser;
    access_token: string;
    token_type: string;
  };
}

const fieldClass =
  'h-11 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none disabled:opacity-50';

/* ─────────────────── Pending Approval Modal ─────────────────── */

function PendingApprovalModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#966FD6]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-amber-50 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          {/* Icon */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Clock className="size-10 text-amber-500" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
              className="absolute -top-1 -right-1 w-7 h-7 bg-[#966FD6] rounded-full flex items-center justify-center shadow-lg"
            >
              <CheckCircle2 className="size-4 text-white" />
            </motion.div>
          </div>

          <h2 className="text-2xl font-black text-black tracking-tight mb-2">
            Application Submitted!
          </h2>
          <p className="text-zinc-500 font-medium mb-1">
            Hi <span className="font-bold text-black">{name}</span> 👋
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            Your wholesaler account request has been received. Our admin team will review your application and approve your account soon.
          </p>

          {/* Status steps */}
          <div className="bg-zinc-50 rounded-xl p-4 mb-6 text-left space-y-3">
            {[
              { label: 'Application submitted', done: true },
              { label: 'Admin review in progress', done: false, active: true },
              { label: 'Account approved & B2B access granted', done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black',
                  step.done ? 'bg-green-500 text-white' :
                  step.active ? 'bg-amber-400 text-white animate-pulse' :
                  'bg-zinc-200 text-zinc-400'
                )}>
                  {step.done ? '✓' : i + 1}
                </div>
                <span className={cn(
                  'text-sm font-semibold',
                  step.done ? 'text-green-600' :
                  step.active ? 'text-amber-600' :
                  'text-zinc-400'
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-400 mb-6">
            You'll receive an email notification once your account is approved.
          </p>

          <Button
            onClick={onClose}
            className="w-full h-12 bg-[#966FD6] hover:bg-[#7d5bbf] text-white font-bold rounded-xl transition-all active:scale-[0.98]"
          >
            Got it, I'll wait!
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────── Register Form ─────────────────── */

export function RegisterForm() {
  const [role, setRole] = React.useState<Role>('customer');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [pendingApproval, setPendingApproval] = React.useState(false);
  const [submittedName, setSubmittedName] = React.useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const setUser = useAppStore((s) => s.setUser);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(role === 'wholesaler' ? wholesalerSchema : customerSchema),
  });

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setErrorMessage(null);
    reset();
  };

  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const body: Record<string, string> = {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role,
      };
      if (data.phone) body.phone = data.phone;
      if (data.company_name) body.company_name = data.company_name;
      if (data.address) body.address = data.address;

      const res = await apiFetch<RegisterResponse>('/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Wholesaler → show pending approval modal (don't log them in yet)
      if (role === 'wholesaler') {
        setSubmittedName(data.name);
        setPendingApproval(true);
        return;
      }

      // Customer → log in immediately and redirect
      setAuthCookie(res.data.access_token);
      setUser(res.data.user);

      const userRole = res.data.user?.role;
      if (redirectTo && redirectTo.startsWith('/')) {
        window.location.href = redirectTo;
      } else if (userRole === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/';
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setPendingApproval(false);
    window.location.href = '/';
  };

  return (
    <>
      {/* Pending Approval Overlay */}
      <AnimatePresence>
        {pendingApproval && (
          <PendingApprovalModal name={submittedName} onClose={handleModalClose} />
        )}
      </AnimatePresence>

      <div className="w-full">
        {/* ── Role Toggle ── */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
            I want to register as
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Customer */}
            <button
              type="button"
              id="role-customer"
              onClick={() => handleRoleChange('customer')}
              className={cn(
                'relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200 cursor-pointer group',
                role === 'customer'
                  ? 'border-[#966FD6] bg-[#966FD6]/5 shadow-[0_0_0_4px_rgba(150,111,214,0.08)]'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                role === 'customer' ? 'bg-[#966FD6] text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200',
              )}>
                <ShoppingBag className="size-5" />
              </div>
              <span className={cn('text-sm font-bold transition-colors', role === 'customer' ? 'text-[#966FD6]' : 'text-zinc-500')}>
                Customer
              </span>
              <span className="text-[10px] text-zinc-400 font-medium text-center leading-tight">
                Shop &amp; buy products
              </span>
              {role === 'customer' && (
                <motion.div layoutId="role-dot" className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#966FD6]" />
              )}
            </button>

            {/* Wholesaler */}
            <button
              type="button"
              id="role-wholesaler"
              onClick={() => handleRoleChange('wholesaler')}
              className={cn(
                'relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200 cursor-pointer group',
                role === 'wholesaler'
                  ? 'border-[#966FD6] bg-[#966FD6]/5 shadow-[0_0_0_4px_rgba(150,111,214,0.08)]'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                role === 'wholesaler' ? 'bg-[#966FD6] text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200',
              )}>
                <Building2 className="size-5" />
              </div>
              <span className={cn('text-sm font-bold transition-colors', role === 'wholesaler' ? 'text-[#966FD6]' : 'text-zinc-500')}>
                Wholesaler
              </span>
              <span className="text-[10px] text-zinc-400 font-medium text-center leading-tight">
                Bulk orders &amp; B2B
              </span>
              {role === 'wholesaler' && (
                <motion.div layoutId="role-dot" className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#966FD6]" />
              )}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        <AnimatePresence mode="wait">
          {errorMessage && (
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

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1">
            <Input id="name" placeholder="Full Name *" type="text" autoComplete="name" disabled={isLoading} className={fieldClass} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Input id="email" placeholder="Email Address *" type="email" autoComplete="email" disabled={isLoading} className={fieldClass} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Phone (now for both roles) */}
          <div className="space-y-1">
            <Input id="phone" placeholder="Phone Number *" type="tel" autoComplete="tel" disabled={isLoading} className={fieldClass} {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          {/* Wholesaler extra fields */}
          <AnimatePresence>
            {role === 'wholesaler' && (
              <motion.div
                key="ws-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-5 pt-1">
                  <div className="space-y-1">
                    <Input id="company_name" placeholder="Company / Business Name *" type="text" disabled={isLoading} className={fieldClass} {...register('company_name')} />
                    {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Input id="address" placeholder="Business Address *" type="text" disabled={isLoading} className={fieldClass} {...register('address')} />
                    {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password */}
          <div className="space-y-1">
            <div className="relative">
              <Input id="password" placeholder="Password *" type={showPassword ? 'text' : 'password'} autoComplete="new-password" disabled={isLoading} className={cn(fieldClass, 'pr-10')} {...register('password')} />
              <button type="button" tabIndex={-1} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <div className="relative">
              <Input id="password_confirmation" placeholder="Confirm Password *" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" disabled={isLoading} className={cn(fieldClass, 'pr-10')} {...register('password_confirmation')} />
              <button type="button" tabIndex={-1} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
          </div>

          {/* Wholesaler note */}
          <AnimatePresence>
            {role === 'wholesaler' && (
              <motion.div
                key="ws-note"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5"
              >
                <Clock className="size-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                <span>Your wholesaler account will be <strong>reviewed by our admin team</strong> before B2B access is granted. You will be notified once approved.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <Button
            type="submit"
            id="register-submit"
            className="w-full h-[50px] rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-medium transition-all disabled:opacity-70 active:scale-[0.98] cursor-pointer mt-2"
            disabled={isLoading}
          >
            {isLoading
              ? <Spinner size="sm" className="border-white" />
              : role === 'wholesaler' ? 'Submit Wholesale Application' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-zinc-400">or</span></div>
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
    </>
  );
}
