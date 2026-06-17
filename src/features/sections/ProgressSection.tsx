'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/web/auth-store-web';
import { openFlutterwaveCheckout } from '@/lib/payments/flutterwave-checkout';
import { supabase } from '@/lib/supabase-web';
import {
  Flame, Award, TrendingUp, CheckCircle, Sparkles,
  Activity, Trophy, BarChart3, Calendar, ChevronRight, Lock, Crown,
} from 'lucide-react';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEK_BARS = [70, 45, 90, 60, 80, 50, 75];

const MOOD_DATA = [
  { day: 'Mon', emoji: '😊', value: 4 }, { day: 'Tue', emoji: '😐', value: 3 },
  { day: 'Wed', emoji: '😌', value: 4 }, { day: 'Thu', emoji: '😊', value: 5 },
  { day: 'Fri', emoji: '😢', value: 2 }, { day: 'Sat', emoji: '😊', value: 4 },
  { day: 'Sun', emoji: '😊', value: 5 },
];

export function ProgressSection() {
  const { user } = useAuthStore();
  const [showPremium, setShowPremium] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const isPremium = !!(user?.app_metadata?.isPremium || user?.user_metadata?.isPremium);

  const handleUpgrade = async () => {
    setUpgrading(true);
    const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    try {
      const txRef = `MOMENTUM-PREMIUM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await openFlutterwaveCheckout({
        txRef,
        amount: 1200,
        email: user?.email || '',
        name: displayName,
        onSuccess: async (transactionId) => {
          try {
            const res = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionId, userId: user?.id, email: user?.email, name: displayName }),
            });
            const result = await res.json();
            if (result.verified) {
              await supabase.auth.updateUser({ data: { isPremium: true } });
              await supabase.auth.refreshSession();
              setShowPremium(false);
            }
          } catch {
            alert('Payment verified but upgrade processing failed. Please contact support.');
          } finally {
            setUpgrading(false);
          }
        },
        onClose: () => {
          setUpgrading(false);
        },
      });
    } catch {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-800 text-text-primary tracking-tight">Your Progress</h1>
        <p className="text-sm text-text-muted mt-1">Track your consistency and growth</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Flame, value: '5', label: 'Day Streak', sub: 'Current', color: 'text-primary-500', bg: 'bg-primary-50' },
          { icon: Award, value: '14', label: 'Longest Streak', sub: 'Best', color: 'text-warning-500', bg: 'bg-warning-50' },
          { icon: TrendingUp, value: '87%', label: 'Consistency', sub: 'This week', color: 'text-success-500', bg: 'bg-success-50' },
          { icon: CheckCircle, value: '12', label: 'Tasks Done', sub: 'Total', color: 'text-info-500', bg: 'bg-info-50' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-bg-surface rounded-xl p-4 border border-border-base shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                <Icon size={18} className={item.color} />
              </div>
              <p className="text-xl font-display font-800 text-text-primary tracking-tight">{item.value}</p>
              <p className="text-xs font-semibold text-text-secondary mt-0.5">{item.label}</p>
              <p className="text-[10px] text-text-muted">{item.sub}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-sm font-bold font-display text-text-primary mb-3">Weekly Performance</h3>
        <div className="bg-bg-surface rounded-xl p-5 border border-border-base shadow-sm">
          <div className="flex items-center justify-between">
            {DAYS.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-[10px] font-semibold text-text-muted">{day}</span>
                <div className="w-full max-w-[28px] h-24 rounded-md bg-bg-elevated overflow-hidden flex items-end">
                  <div className="w-full bg-primary-500 rounded-md transition-all duration-500" style={{ height: `${WEEK_BARS[i]}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border-base">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-xs text-text-secondary">Consistency score</span>
            </div>
            <span className="text-xs font-bold text-text-primary">87%</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold font-display text-text-primary mb-3">Mood Trends</h3>
        <div className="bg-bg-surface rounded-xl p-5 border border-border-base shadow-sm">
          <div className="flex items-center justify-between">
            {MOOD_DATA.map((mood) => (
              <div key={mood.day} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-lg">{mood.emoji}</span>
                <div className="w-full max-w-[20px] h-16 rounded-md bg-bg-elevated overflow-hidden flex items-end">
                  <div className={`w-full rounded-md transition-all duration-500 ${mood.value >= 4 ? 'bg-success-500' : mood.value >= 3 ? 'bg-warning-500' : 'bg-error-500'}`} style={{ height: `${(mood.value / 5) * 100}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-text-muted">{mood.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 mt-4 pt-3 border-t border-border-base">
            <Sparkles size={14} className="text-primary-500 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="font-bold text-text-primary">Insight: </span>
              Your mood tends to dip on Fridays. Try scheduling something enjoyable that day to maintain momentum.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold font-display text-text-primary mb-3">Goal Progress</h3>
        <div className="bg-bg-surface rounded-xl p-5 border border-border-base shadow-sm space-y-4">
          {[
            { title: 'Learn UI/UX Design', percent: 25 },
            { title: 'Master React & Next.js', percent: 15 },
            { title: 'Read 12 Books', percent: 42 },
          ].map((goal) => (
            <div key={goal.title}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-semibold text-text-primary">{goal.title}</span>
                <span className="font-bold text-text-primary">{goal.percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${goal.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold font-display text-text-primary mb-3">Recent Activity</h3>
        <div className="bg-bg-surface rounded-xl p-5 border border-border-base shadow-sm">
          <div className="space-y-0">
            {[
              { label: 'Completed check-in', date: 'Today, 9:30 AM', type: 'checkin' },
              { label: 'Extended streak to 5 days', date: 'Yesterday, 8:15 PM', type: 'streak' },
              { label: 'Finished color palette exercise', date: 'Yesterday, 6:45 PM', type: 'milestone' },
              { label: 'Saved new resource', date: '2 days ago', type: 'resource' },
              { label: 'Talked to coach', date: '3 days ago', type: 'coach' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-border-base last:border-0">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5" />
                  {i < 4 && <div className="w-px h-6 bg-border-base" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold font-display text-text-primary">Reports</h3>
          {!isPremium && (
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-500 text-[10px] font-bold flex items-center gap-1">
              <Lock size={10} />
              Premium
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: BarChart3, label: 'Weekly Report', desc: 'View your weekly performance summary', color: 'text-primary-500' },
            { icon: Activity, label: 'Consistency Report', desc: 'Deep dive into your habits', color: 'text-success-500' },
            { icon: Trophy, label: 'Achievements', desc: 'Badges and milestones earned', color: 'text-warning-500' },
            { icon: Calendar, label: 'Monthly Review', desc: 'Month-over-month comparison', color: 'text-info-500' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => { if (!isPremium) setShowPremium(true); }}
                className={`flex items-center gap-3 p-4 rounded-xl bg-bg-surface border border-border-base hover:shadow-md transition-all text-left ${!isPremium ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className={item.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
                {!isPremium ? (
                  <Lock size={14} className="text-text-muted flex-shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showPremium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-bg-surface rounded-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
              <Lock size={24} className="text-primary-500" />
            </div>
            <h3 className="text-lg font-display font-800 text-text-primary">Upgrade to Premium</h3>
            <p className="text-sm text-text-secondary">Advanced progress analytics, reports, and insights are available exclusively for Premium members.</p>
            <button onClick={handleUpgrade} disabled={upgrading} className="w-full py-3 rounded-lg bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {upgrading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Crown size={16} />}
              {upgrading ? 'Processing...' : 'Upgrade Now — ₦1,200/mo'}
            </button>
            <button onClick={() => setShowPremium(false)} className="text-sm font-semibold text-text-muted hover:text-text-secondary">Maybe later</button>
          </div>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
