import { Suspense } from 'react';
import { ResetPasswordForm } from '@/src/components/auth-components/reset-password-form';
import Link from 'next/link';
import { X } from 'lucide-react';
import HomePage from '@/src/components/home-page-components/HomePage';

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export const metadata = {
  title: 'Reset Password | B2B Commerce',
  description: 'Set a new password for your B2B Commerce account.',
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;

  return (
    <div className="relative min-h-screen">

      {/* Real homepage as blurred background */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        <HomePage />
      </div>

      {/* Reset password modal overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />

        <div className="relative z-10 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-zinc-100 flex flex-col justify-center w-[calc(100vw-2rem)] sm:w-[460px] h-auto max-h-[calc(100vh-2rem)] max-w-[100vw] px-6 sm:px-10 py-6 sm:py-8">

            {/* X close button */}
            <Link
              href="/"
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </Link>

            {/* Header */}
            <div className="flex flex-col gap-2 mb-8 text-left">
              <h1
                className="text-black m-0 tracking-[0.04em]"
                style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '32px', lineHeight: '100%' }}
              >
                Reset Password
              </h1>
              <p
                className="text-zinc-500 m-0"
                style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }}
              >
                Enter your email and your new password below.
              </p>
            </div>

            <Suspense fallback={<div className="h-40 animate-pulse bg-zinc-100 rounded" />}>
              <ResetPasswordForm token={token} />
            </Suspense>

            <div className="mt-8 text-center" style={{ fontFamily: 'Lato, sans-serif' }}>
              <span className="text-zinc-500 text-sm">Remember your password? </span>
              <Link href="/login" className="text-[#966FD6] text-sm font-semibold hover:underline underline-offset-4">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
