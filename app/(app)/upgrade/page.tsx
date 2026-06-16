'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Zap, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/web/auth-store-web';
import { supabase } from '@/lib/supabase-web';

const PREMIUM_FEATURES = [
  'Unlimited daily goals (vs 1 free)',
  'Unlimited AI coaching messages',
  'Advanced progress analytics',
  'Exclusive mentorship opportunities',
  'Priority notification settings',
];

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    const status = searchParams.get('status');

    if (status === 'successful' || status === 'completed') {
      if (transactionId && user?.id) {
        verifyAndUpgrade(transactionId, user.id);
      }
    } else if (status === 'cancelled') {
      setError('Payment was cancelled.');
    }
  }, [searchParams, user?.id]);

  const verifyAndUpgrade = async (transactionId: string, userId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, userId, email: user?.email, name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User' }),
      });

      const result = await res.json();

      if (result.verified) {
        await supabase.auth.updateUser({ data: { isPremium: true } });
        await supabase.auth.refreshSession();
        alert('Welcome to Premium! Your account has been upgraded.');
        router.replace('/profile');
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch {
      setError('Could not verify payment. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setError('');
    setIsLoading(true);

    try {
      const email = user?.email || '';
      const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, userId: user?.id }),
      });

      const data = await res.json();

      if (data.link) {
        window.location.href = data.link;
      } else {
        setError(data.error || 'Failed to initiate payment');
        setIsLoading(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-400 mb-6">
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-primary-500" />
          </div>
          <h1 className="text-3xl font-display font-800 text-text-primary tracking-tight">Upgrade to Premium</h1>
          <p className="text-sm text-text-secondary mt-2">Unlock your full potential with Momentum Premium</p>
        </div>

        <div className="bg-bg-surface rounded-xl p-6 border border-border-base space-y-4 mb-6">
          {PREMIUM_FEATURES.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={14} className="text-success-500" />
              </div>
              <p className="text-sm text-text-secondary">{feature}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-50 text-error-500 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <div className="text-center space-y-4">
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-primary-500 text-white font-800 font-display text-lg hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isLoading ? 'Processing...' : 'Upgrade Now — ₦1,200/mo'}
          </button>
          <p className="text-xs text-text-muted">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
