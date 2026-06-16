'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase-web';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login`,
      });
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
            <Mail size={28} className="text-primary-500" />
          </div>
          <h1 className="text-xl font-display font-800 text-text-primary tracking-tight">Check your email</h1>
          <p className="text-sm text-text-secondary">
            We&apos;ve sent password reset instructions to{' '}
            <span className="font-bold text-text-primary">{email}</span>.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 px-6 py-3 rounded-lg border border-border-base text-sm font-semibold text-text-secondary hover:bg-bg-elevated transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="px-6 py-4">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-400">
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={26} className="text-primary-500" />
          </div>
          <h1 className="text-xl font-display font-800 text-text-primary tracking-tight mb-2">Reset password</h1>
          <p className="text-sm text-text-secondary mb-6">Enter your email and we&apos;ll send you instructions</p>

          <form onSubmit={handleSubmit} className="bg-bg-surface rounded-[20px] p-7 border border-border-base space-y-5 text-left">
            {error && (
              <div className="p-3 rounded-lg bg-error-50 text-error-500 text-sm font-semibold">{error}</div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={!email || !email.includes('@') || loading}
              className="w-full py-3.5 rounded-lg bg-primary-500 text-white font-bold text-base disabled:opacity-40 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Sending...' : 'Send Instructions'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
