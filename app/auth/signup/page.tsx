'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/web/auth-store-web';

const SPECIAL_CHARS_RE = /[!@#$%^&*(),.?":{}|<>]/;

function validatePassword(v: string): string | undefined {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Minimum 8 characters';
  if (!/[A-Z]/.test(v)) return 'Must contain an uppercase letter';
  if (!/[a-z]/.test(v)) return 'Must contain a lowercase letter';
  if (!/[0-9]/.test(v)) return 'Must contain a number';
  if (!SPECIAL_CHARS_RE.test(v)) return 'Must contain a special character';
  return undefined;
}

export default function SignupPage() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const nameError = touched.name && !name ? 'Name is required' : '';
  const emailError = touched.email && !email ? 'Email is required' : '';
  const passError = touched.password ? validatePassword(password) : undefined;
  const isValid = !!name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !!password && !validatePassword(password);

  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!name || !email || validatePassword(password)) {
      setTouched({ name: true, email: true, password: true });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signUp(email, password, name);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      if (result.requiresEmailConfirmation) {
        setConfirmEmail(email);
        setLoading(false);
        return;
      }

      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      }).catch((e) => console.error('[welcome-email]', e));

      router.replace('/onboarding/1');
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
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={26} className="text-primary-500" />
            </div>
            <h1 className="text-2xl font-display font-800 text-text-primary tracking-tight">Create account</h1>
            <p className="text-sm text-text-secondary mt-1">Start your momentum journey</p>
          </div>

          {confirmEmail ? (
            <div className="bg-bg-surface rounded-[20px] p-7 border border-border-base text-center">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-800 text-text-primary tracking-tight mb-3">Check your email</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                We&apos;ve sent a confirmation link to{' '}
                <span className="font-semibold text-text-primary">{confirmEmail}</span>.
                Click the link to activate your account, then sign in.
              </p>
              <Link
                href="/auth/login?email_confirmation=required"
                className="inline-block w-full py-3.5 rounded-lg bg-primary-500 text-white font-bold text-base text-center hover:bg-primary-600 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
          <form onSubmit={handleSignup} className="bg-bg-surface rounded-[20px] p-7 border border-border-base space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-error-50 text-error-500 text-sm font-semibold">{error}</div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                placeholder="Your name"
                autoComplete="name"
              />
              {nameError && <p className="text-error-500 text-xs mt-1">{nameError}</p>}
            </div>

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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full py-3.5 rounded-lg bg-primary-500 text-white font-bold text-base disabled:opacity-40 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-text-muted">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-500 font-semibold hover:text-primary-400">
                Sign in
              </Link>
            </p>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
