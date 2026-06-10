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
import { AlertCircle, User, Building2, Check } from 'lucide-react';
import { apiFetch } from '@/src/lib/api';
import { setAuthCookie } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';
import { cn } from '@/src/lib/utils';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Please enter a valid email address').max(255),
    role: z.enum(['customer', 'wholesaler']),
    phone: z.string().max(25),
    company_name: z.string().max(255),
    address: z.string().max(1000),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  })
  .superRefine((data, ctx) => {
    if (data.role === 'wholesaler') {
      if (!data.phone || data.phone.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Phone is required for wholesalers', path: ['phone'] });
      }
      if (!data.company_name || data.company_name.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company name is required for wholesalers', path: ['company_name'] });
      }
      if (!data.address || data.address.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Address is required for wholesalers', path: ['address'] });
      }
    }
  });

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterResponse {
  message: string;
  data: {
    user: any;
    access_token: string;
    token_type: string;
  };
}

const fieldClass =
  'h-11 w-full border-b-[1.5px] border-t-0 border-x-0 border-zinc-300 bg-transparent rounded-none px-0 text-base placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-[#966FD6] transition-colors shadow-none disabled:opacity-50';

export function RegisterForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const setUser = useAppStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'customer',
      phone: '',
      company_name: '',
      address: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.role === 'wholesaler' ? data.phone : null,
        company_name: data.role === 'wholesaler' ? data.company_name : null,
        address: data.role === 'wholesaler' ? data.address : null,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role: data.role,
      };

      const res = await apiFetch<RegisterResponse>('/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setAuthCookie(res.data.access_token);
      setUser(res.data.user);

      const role = res.data.user?.role;
      if (redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo);
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'wholeseller' || role === 'wholesaler') {
        router.push('/wholeseller');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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

      <div className="flex gap-4 mb-8">
        {[
          { id: 'customer', name: 'Customer', icon: User },
          { id: 'wholesaler', name: 'Wholesaler', icon: Building2 },
        ].map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setValue('role', role.id as 'customer' | 'wholesaler')}
            className={cn(
              'flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group',
              selectedRole === role.id
                ? 'border-[#966FD6] bg-[#966FD6]/5 text-[#966FD6]'
                : 'border-zinc-100 bg-zinc-50/50 text-zinc-500 hover:border-zinc-200'
            )}
            disabled={isLoading}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
              selectedRole === role.id ? "bg-[#966FD6] text-white" : "bg-white text-zinc-400 group-hover:text-zinc-600"
            )}>
              <role.icon className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm uppercase tracking-wider">{role.name}</span>
            
            {selectedRole === role.id && (
              <motion.div 
                layoutId="active-role"
                className="absolute top-2 right-2 w-5 h-5 bg-[#966FD6] rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1">
          <Input id="name" placeholder="Name" type="text" autoComplete="name" disabled={isLoading} className={fieldClass} {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Input id="email" placeholder="Email" type="email" autoComplete="email" disabled={isLoading} className={fieldClass} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <AnimatePresence>
          {selectedRole === 'wholesaler' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5 overflow-hidden"
            >
              <div className="space-y-1">
                <Input id="phone" placeholder="Phone Number" type="tel" disabled={isLoading} className={fieldClass} {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <Input id="company_name" placeholder="Company Name" type="text" disabled={isLoading} className={fieldClass} {...register('company_name')} />
                {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
              </div>

              <div className="space-y-1">
                <Input id="address" placeholder="Company Address" type="text" disabled={isLoading} className={fieldClass} {...register('address')} />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          <Input id="password" placeholder="Password (Min 8 chars)" type="password" autoComplete="new-password" disabled={isLoading} className={fieldClass} {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1">
          <Input id="password_confirmation" placeholder="Confirm Password" type="password" autoComplete="new-password" disabled={isLoading} className={fieldClass} {...register('password_confirmation')} />
          {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-[50px] rounded bg-[#966FD6] hover:bg-[#7d5bbf] text-white text-base font-bold transition-all disabled:opacity-70 active:scale-[0.98] cursor-pointer mt-4 shadow-lg shadow-[#966FD6]/20"
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" className="border-white" /> : `Register as ${selectedRole === 'customer' ? 'Customer' : 'Wholesaler'}`}
        </Button>
      </form>
    </div>
  );
}
