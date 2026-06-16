import { Sparkles } from 'lucide-react';
import Link from 'next/link';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
            <Sparkles size={20} className="text-primary-500" />
          </div>
          <span className="text-xl font-display font-800 text-text-primary tracking-tight">Momentum</span>
        </div>
        <Link
          href="/auth/login"
          className="px-5 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary font-semibold text-sm hover:bg-border-light transition-colors"
        >
          Sign In
        </Link>
      </div>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-8">
          <Sparkles size={32} className="text-primary-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-800 text-text-primary tracking-tight mb-4">
          Momentum
        </h1>
        <p className="text-lg font-semibold font-display text-primary-500 mb-4">
          Africa&apos;s first emotionally intelligent AI accountability coach.
        </p>
        <p className="text-base text-text-secondary leading-relaxed mb-12 max-w-md">
          Stay consistent, improve your skills, and reach your goals with a companion that understands your journey.
        </p>
        <Link
          href="/auth/signup"
          className="px-8 py-4 rounded-xl bg-primary-500 text-white font-800 font-display text-base hover:bg-primary-600 transition-colors shadow-lg w-full max-w-sm text-center"
        >
          Get Started
        </Link>
        <p className="text-xs text-text-muted mt-4">
          Join thousands of others building better habits today.
        </p>
      </main>
    </div>
  );
}
