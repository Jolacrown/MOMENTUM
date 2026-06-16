'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/web/auth-store-web';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const requiresConfirmation = searchParams.get('email_confirmation') === 'required';

  const emailError = touched.email && !email ? 'Email is required' : '';
  const passError = touched.password && !password ? 'Password is required' : '';
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !!password;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) {
      setTouched({ email: true, password: true });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.replace('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-400 transition-colors">
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={26} className="text-primary-500" />
            </div>
            <h1 className="text-2xl font-display font-800 text-text-primary tracking-tight">Welcome back</h1>
            <p className="text-sm text-text-secondary mt-1">Sign in to continue your journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="bg-bg-surface rounded-[20px] p-7 border border-border-base space-y-5">
            {requiresConfirmation && (
              <div className="p-3 rounded-lg bg-primary-50 text-primary-500 text-sm font-semibold">
                Please confirm your email before signing in. Check your inbox for the confirmation link.
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-error-50 text-error-500 text-sm font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {emailError && <p className="text-error-500 text-xs mt-1">{emailError}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  className="w-full px-4 py-3 pr-10 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passError && <p className="text-error-500 text-xs mt-1">{passError}</p>}
            </div>

            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm font-semibold text-primary-500 hover:text-primary-400">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full py-3.5 rounded-lg bg-primary-500 text-white font-bold text-base disabled:opacity-40 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary-500 font-semibold hover:text-primary-400">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
