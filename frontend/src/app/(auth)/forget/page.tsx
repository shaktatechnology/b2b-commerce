'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { toast } from 'sonner';

export default function ForgetPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      // Direct post request to forgot password api route
      const res = await fetch('http://localhost:8000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reset link');
      }

      toast.success(data.message || 'Reset link sent successfully!');
      setEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Error occurred while sending reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Forget Password</h1>
        <p className="text-sm text-zinc-500">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Input
            id="email"
            placeholder="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="h-11 rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#966FD6]/20 transition-all text-sm"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-lg bg-[#966FD6] hover:bg-[#855fc4] text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => router.push('/login')}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors font-medium"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
