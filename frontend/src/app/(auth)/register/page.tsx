import { Suspense } from 'react';
import { RegisterForm } from '@/src/components/auth-components/register-form';
import Link from 'next/link';

interface RegisterPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { redirect } = await searchParams;
  const loginHref = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : '/login';
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-100/50 p-4 overflow-hidden">
      {/* Background Content Simulation */}
      <div className="absolute inset-0 z-0 bg-white grid grid-cols-4 gap-4 p-8 opacity-20 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-200 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Dimmed Backdrop */}
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />

      {/* Register Card (Popup) */}
      <div className="relative z-20 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div
          className="bg-white rounded-[10px] shadow-2xl flex flex-col w-[calc(100vw-2rem)] sm:w-[460px] h-auto max-h-[calc(100vh-2rem)] max-w-[100vw] px-6 sm:px-10 py-6 sm:py-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* Header */}
          <div className="flex flex-col gap-2 mb-8 text-left">
            <h1
              className="text-black m-0 tracking-[0.04em]"
              style={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 700,
                fontSize: '32px',
                lineHeight: '100%',
              }}
            >
              Create an account
            </h1>
            <p
              className="text-zinc-500 m-0"
              style={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              Enter your details below
            </p>
          </div>

          <Suspense fallback={<div className="h-48 animate-pulse bg-zinc-100 rounded" />}>
            <RegisterForm />
          </Suspense>

          <div className="mt-8 text-center" style={{ fontFamily: 'Lato, sans-serif' }}>
            <span className="text-zinc-500 text-sm">Already have an account? </span>
            <Link href={loginHref} className="text-[#966FD6] text-sm font-semibold hover:underline underline-offset-4">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}