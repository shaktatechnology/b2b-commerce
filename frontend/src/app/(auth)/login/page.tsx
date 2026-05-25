import { Suspense } from 'react';
import { LoginForm } from '@/src/components/auth-components/login-form';
import Link from 'next/link';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  const registerHref = redirect
    ? `/register?redirect=${encodeURIComponent(redirect)}`
    : '/register';
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

      {/* Login Card (Popup) */}
      <div className="relative z-20 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-[10px] shadow-2xl flex flex-col justify-center w-[calc(100vw-2rem)] sm:w-[460px] h-auto max-h-[calc(100vh-2rem)] sm:h-[420px] max-w-[100vw] px-6 sm:px-10 py-6 sm:py-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex flex-col gap-2 mb-8 text-left">
            <h1 
              className="text-black m-0 tracking-[0.04em]" 
              style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '32px', lineHeight: '100%' }}
            >
              Log in to Exclusive
            </h1>
            <p 
              className="text-zinc-500 m-0" 
              style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }}
            >
              Enter your details below
            </p>
          </div>
          
          <Suspense fallback={<div className="h-40 animate-pulse bg-zinc-100 rounded" />}>
            <LoginForm />
          </Suspense>

          <div className="mt-8 text-center space-y-2" style={{ fontFamily: 'Lato, sans-serif' }}>
            <p>
              <span className="text-zinc-500 text-sm">Don&apos;t have an account? </span>
              <Link href={registerHref} className="text-[#966FD6] text-sm font-semibold hover:underline underline-offset-4">
                Sign up
              </Link>
            </p>
            <p className="text-zinc-400 text-xs">
              Login or register is required to complete checkout and payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}