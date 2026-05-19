'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const passwordStrength =
    password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.register(name, email, password);
      setAuth(res.accessToken, res.user);
      toast.success('Account created');
      router.push('/');
    } catch (err) {
      toast.error('Registration failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-slide-in-up">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-white">Create account</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Start simulating production traffic in minutes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Full name
            </Label>
            <Input
              type="text"
              placeholder="Kingsley Chibuike"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Work email
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
            <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= level ? strengthColor[passwordStrength] : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-500">{strengthLabel[passwordStrength]}</p>
              </div>
            )}
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
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
          {[
            'Simulate up to 10M+ concurrent users',
            'Real-time failure detection',
            'Full audit trail on every run',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Check size={9} className="text-blue-400" />
              </div>
              <span className="text-xs text-zinc-500">{feature}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-500 mt-4">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
