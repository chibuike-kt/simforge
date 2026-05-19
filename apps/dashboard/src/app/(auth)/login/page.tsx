'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: wire to auth endpoint in Phase 5
      await new Promise((r) => setTimeout(r, 1200));
      window.location.href = '/';
    } catch {
      setError('Invalid email or password.');
    } finally {
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
            <Label
              htmlFor="email"
              className="text-zinc-400 text-xs font-medium uppercase tracking-wider"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-zinc-400 text-xs font-medium uppercase tracking-wider"
              >
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
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 h-10 pr-10"
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

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white h-10 font-medium transition-all"
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

      {/* Security note */}
      <p className="text-center text-xs text-zinc-600 mt-4">Protected by end-to-end encryption</p>
    </div>
  );
}
