'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

 async function handleSubmit(e: React.FormEvent) {
   e.preventDefault();
   setLoading(true);

   try {
     const res = await api.login(email, password);
     setAuth(res.accessToken, res.user);
     toast.success('Welcome back');
     // Hard navigation — ensures localStorage is read fresh on next page load
     setTimeout(() => {
       window.location.href = '/';
     }, 500);
   } catch (err) {
     console.error('[Login] error:', err);
     toast.error('Sign in failed', {
       description: err instanceof Error ? err.message : 'Invalid credentials',
     });
     setLoading(false);
   }
 }

  return (
    <div className="animate-slide-in-up">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-white">Sign in</h1>
          <p className="text-sm text-zinc-500 mt-1">Enter your credentials to access SimForge</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Email
            </Label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Password
              </Label>
              <Link
                href="#"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500 h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white h-10 font-medium"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin mr-2" />
            ) : (
              <ArrowRight size={14} className="mr-2" />
            )}
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-center text-xs text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-zinc-600 mt-4">Protected by end-to-end encryption</p>
    </div>
  );
}
