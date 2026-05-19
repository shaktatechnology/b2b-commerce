'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Spinner } from '@/src/components/ui/spinner';
import { AlertCircle, CheckCircle2, Building2, Phone, Mail, MapPin, Package, User } from 'lucide-react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';

const wholesellerSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  contact_person: z.string().min(1, 'Contact person name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(7, 'Phone number is required'),
  address: z.string().min(5, 'Business address is required'),
  product_category: z.string().min(1, 'Product category is required'),
  message: z.string().optional(),
});

type WholesalerValues = z.infer<typeof wholesellerSchema>;

const PERKS = [
  'Access to bulk pricing & exclusive deals',
  'Dedicated account manager support',
  'Priority shipping & fulfillment',
  'Custom invoicing & net-30 terms',
];

export default function WholesalerPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WholesalerValues>({
    resolver: zodResolver(wholesellerSchema),
  });

  const onSubmit = async (data: WholesalerValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = getAuthToken();
      await apiFetch('/wholeseller/register', {
        method: 'POST',
        body: JSON.stringify(data),
        ...(token ? { token } : {}),
      });
      setSuccess(true);
      reset();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Lato, sans-serif' }}>
      {/* Top Nav Bar */}
      <nav className="h-16 border-b border-zinc-100 flex items-center px-8 justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#966FD6] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-lg text-zinc-900 tracking-tight">B2B Commerce</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Log in</a>
          <a
            href="/register"
            className="text-sm font-medium bg-[#966FD6] text-white px-4 py-2 rounded hover:bg-[#966FD6]/90 transition-all"
          >
            Sign up
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* ── Left: Hero & Info ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 lg:sticky lg:top-24"
          >
            {/* Badge */}
            <span className="inline-block bg-[#966FD6]/10 text-[#966FD6] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
              Wholesale Program
            </span>

            <div className="space-y-4">
              <h1
                className="text-black leading-[1.1]"
                style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-0.01em' }}
              >
                Become a <span className="text-[#966FD6]">Wholeseller</span>
              </h1>
              <p className="text-zinc-500 text-lg leading-relaxed max-w-md">
                Join our growing network of wholesale partners and unlock exclusive pricing,
                priority fulfillment, and dedicated support.
              </p>
            </div>

            {/* Hero Image */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/wholeseller-hero.png"
                alt="Become a wholeseller"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#966FD6]/40 to-transparent" />
            </div>

            {/* Perks list */}
            <ul className="space-y-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-zinc-700 text-base">
                  <CheckCircle2 className="h-5 w-5 text-[#966FD6] shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── Right: Form ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white border border-zinc-100 rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.06)] p-8 sm:p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-zinc-900">Apply to join</h2>
                <p className="text-zinc-500 text-sm mt-1">Fill in your business details below. Our team will review and get back to you within 24 hours.</p>
              </div>

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-10 space-y-4"
                  >
                    <div className="w-16 h-16 bg-[#966FD6]/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-[#966FD6]" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">Application Received!</h3>
                    <p className="text-zinc-500 max-w-xs">
                      Thank you for applying. Our team will review your details and reach out within 24 hours.
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className="mt-4 text-sm text-[#966FD6] font-semibold hover:underline underline-offset-4"
                    >
                      Back to Home
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    {errorMessage && (
                      <div className="flex items-center gap-2 rounded-lg bg-destructive/5 border border-destructive/15 px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Two-column row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="business_name">
                          Business Name
                        </label>
                        <div className="relative group">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#966FD6] transition-colors" />
                          <Input
                            id="business_name"
                            placeholder="Acme Wholesale Ltd."
                            disabled={isLoading}
                            className="pl-10 h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all"
                            {...register('business_name')}
                          />
                        </div>
                        {errors.business_name && (
                          <p className="text-xs text-destructive">{errors.business_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="contact_person">
                          Contact Person
                        </label>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#966FD6] transition-colors" />
                          <Input
                            id="contact_person"
                            placeholder="John Doe"
                            disabled={isLoading}
                            className="pl-10 h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all"
                            {...register('contact_person')}
                          />
                        </div>
                        {errors.contact_person && (
                          <p className="text-xs text-destructive">{errors.contact_person.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="ws_email">
                        Business Email
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#966FD6] transition-colors" />
                        <Input
                          id="ws_email"
                          placeholder="contact@acme.com"
                          type="email"
                          disabled={isLoading}
                          className="pl-10 h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all"
                          {...register('email')}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="phone">
                        Phone Number
                      </label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#966FD6] transition-colors" />
                        <Input
                          id="phone"
                          placeholder="+1 (555) 000-0000"
                          type="tel"
                          disabled={isLoading}
                          className="pl-10 h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all"
                          {...register('phone')}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-xs text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="address">
                        Business Address
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#966FD6] transition-colors" />
                        <Input
                          id="address"
                          placeholder="123 Commerce St, City, Country"
                          disabled={isLoading}
                          className="pl-10 h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all"
                          {...register('address')}
                        />
                      </div>
                      {errors.address && (
                        <p className="text-xs text-destructive">{errors.address.message}</p>
                      )}
                    </div>

                    {/* Product Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="product_category">
                        Product Category
                      </label>
                      <div className="relative group">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#966FD6] transition-colors" />
                        <Input
                          id="product_category"
                          placeholder="e.g. Electronics, Apparel, Food..."
                          disabled={isLoading}
                          className="pl-10 h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all"
                          {...register('product_category')}
                        />
                      </div>
                      {errors.product_category && (
                        <p className="text-xs text-destructive">{errors.product_category.message}</p>
                      )}
                    </div>

                    {/* Optional message */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="message">
                        Additional Message <span className="normal-case text-zinc-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="message"
                        placeholder="Tell us more about your business or requirements..."
                        rows={3}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#966FD6]/20 transition-all resize-none disabled:opacity-50"
                        {...register('message')}
                      />
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-lg bg-[#966FD6] hover:bg-[#966FD6]/90 text-white text-base font-semibold shadow-md shadow-[#966FD6]/20 hover:shadow-[#966FD6]/30 transition-all active:scale-[0.98] disabled:opacity-70 mt-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Spinner size="sm" className="border-white" />
                      ) : (
                        'Submit Application'
                      )}
                    </Button>

                    <p className="text-center text-xs text-zinc-400 mt-2">
                      Already a wholeseller?{' '}
                      <a href="/wholeseller-login" className="text-[#966FD6] font-semibold hover:underline underline-offset-4">
                        Log in here
                      </a>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
