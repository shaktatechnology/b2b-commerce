'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/src/components/auth-components/register-form';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function RegisterModalPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />

      {/* Card */}
      <div className="relative z-10 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-zinc-100 flex flex-col w-[calc(100vw-2rem)] sm:w-[460px] h-auto max-h-[calc(100vh-2rem)] max-w-[100vw] px-6 sm:px-10 py-6 sm:py-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* X close button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          <div className="flex flex-col gap-2 mb-8 text-left">
            <h1
              className="text-black m-0 tracking-[0.04em]"
              style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '32px', lineHeight: '100%' }}
            >
              Create an account
            </h1>
            <p
              className="text-zinc-500 m-0"
              style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }}
            >
              Enter your details below
            </p>
          </div>

          <Suspense fallback={<div className="h-48 animate-pulse bg-zinc-100 rounded" />}>
            <RegisterForm />
          </Suspense>

          <div className="mt-8 text-center" style={{ fontFamily: 'Lato, sans-serif' }}>
            <span className="text-zinc-500 text-sm">Already have an account? </span>
            <Link href="/login" className="text-[#966FD6] text-sm font-semibold hover:underline underline-offset-4">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
