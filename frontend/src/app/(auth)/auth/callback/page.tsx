'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthCookie, fetchProfile } from '@/src/lib/auth';
import { useAppStore } from '@/src/store/use-app-store';
import { Spinner } from '@/src/components/ui/spinner';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error) {
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      setAuthCookie(token);
      document.cookie = `role=${role || 'customer'}; path=/; SameSite=Lax`;

      fetchProfile(token)
        .then((user) => {
          setUser(user);
          if (role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/';
          }
        })
        .catch(() => {
          window.location.href = '/';
        });
    } else {
      router.push('/login');
    }
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl border border-zinc-100">
        <Spinner size="lg" className="text-[#966FD6]" />
        <p className="text-zinc-600 font-medium text-base">Completing Google authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-[#966FD6]" />
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
