'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen, GraduationCap, Users, Target, Lock, Plus, TrendingUp,
  Pause, Archive, CircleAlert, ChevronRight, Check,
} from 'lucide-react';
import { useAuthStore } from '@/stores/web/auth-store-web';
import { getGoals } from '@/features/goals/goals.service';
import { openFlutterwaveCheckout } from '@/lib/payments/flutterwave-checkout';
import { supabase } from '@/lib/supabase-web';
import type { GoalStatus } from '@/types';

interface DisplayGoal {
  id: string; title: string; status: GoalStatus; category: string;
  currentStreak: number; longestStreak: number; progressPercent: number;
}

const FALLBACK_GOALS: DisplayGoal[] = [
  { id: '1', title: 'Learn UI/UX Design', status: 'active', category: 'Creative', currentStreak: 5, longestStreak: 7, progressPercent: 25 },
  { id: '2', title: 'Master React & Next.js', status: 'active', category: 'Tech', currentStreak: 3, longestStreak: 3, progressPercent: 15 },
  { id: '3', title: 'Read 12 Books', status: 'paused', category: 'Personal', currentStreak: 0, longestStreak: 7, progressPercent: 42 },
  { id: '4', title: 'Morning Run Routine', status: 'completed', category: 'Health', currentStreak: 0, longestStreak: 14, progressPercent: 100 },
];

const CATEGORIES = [
  { label: 'Tech', icon: BookOpen, color: 'text-info-500', bg: 'bg-info-50' },
  { label: 'Creative', icon: GraduationCap, color: 'text-accent-purple', bg: 'bg-purple-50' },
  { label: 'Health', icon: Users, color: 'text-success-500', bg: 'bg-success-50' },
  { label: 'Personal', icon: Target, color: 'text-primary-500', bg: 'bg-primary-50' },
];

const statusConfig: Record<GoalStatus, { color: string; dot: string }> = {
  active: { color: 'text-success-500', dot: 'bg-success-500' },
  paused: { color: 'text-text-muted', dot: 'bg-text-muted' },
  completed: { color: 'text-info-500', dot: 'bg-info-500' },
};

export function GoalsSection() {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<DisplayGoal[]>(FALLBACK_GOALS);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<DisplayGoal | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    const fetchGoals = async () => {
      setLoading(true);
      try {
        const data = await getGoals(user.id);
        if (!cancelled && data && data.length > 0) {
          setGoals(data.map((g) => ({
            id: g.id,
            title: g.title,
            status: g.status as GoalStatus,
            category: g.category || 'Personal',
            currentStreak: 0,
            longestStreak: 0,
            progressPercent: g.progress_percent,
          })));
        }
      } catch { /* fallback */ }
      if (!cancelled) setLoading(false);
    };
    fetchGoals();
    return () => { cancelled = true; };
  }, [user?.id]);

  const activeCount = goals.filter(g => g.status === 'active').length;
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const streakCount = Math.max(...goals.map(g => g.currentStreak));

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
              alert('Welcome to Premium! Your account has been upgraded.');
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

  const handleCreate = () => {
    const isPremium = !!(user?.app_metadata?.isPremium || user?.user_metadata?.isPremium);
    if (!isPremium && activeCount >= 1) { setShowPremium(true); return; }
  };

  const streakIcon = (streak: number) => {
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '💪';
    if (streak > 0) return '✅';
    return '—';
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: activeCount, label: 'Active', color: 'text-success-500' },
              { value: completedCount, label: 'Completed', color: 'text-info-500' },
              { value: `${streakCount} days`, label: 'Best Streak', color: 'text-primary-500' },
            ].map((item) => (
              <div key={item.label} className="bg-bg-surface rounded-xl p-4 border border-border-base shadow-sm text-center hover:shadow-md transition-shadow">
                <p className={`text-2xl font-display font-800 ${item.color} tracking-tight`}>{item.value}</p>
                <p className="text-xs font-semibold text-text-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-display font-800 text-text-primary tracking-tight">Active Goals</h3>
              <button className="text-sm font-bold text-primary-500 hover:text-primary-400">See All</button>
            </div>
            <div className="space-y-3">
              {goals.filter(g => g.status === 'active').map((goal) => {
                const cat = CATEGORIES.find(c => c.label === goal.category);
                const Icon = cat?.icon || Target;
                return (
                  <div key={goal.id} className="bg-bg-surface rounded-xl p-5 border border-border-base shadow-sm hover:border-primary-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${cat?.bg || 'bg-bg-elevated'} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} className={cat?.color || 'text-text-muted'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold font-display text-text-primary">{goal.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[goal.status].dot}`} />
                              <span className={`text-[10px] font-semibold uppercase ${statusConfig[goal.status].color}`}>{goal.status}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted font-medium">{goal.category}</span>
                            </div>
                          </div>
                          <button onClick={() => { setSelectedGoal(goal); setShowActions(true); }} className="p-1 text-text-muted hover:text-text-secondary">⋯</button>
                        </div>
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">Progress</span>
                            <span className="font-bold text-text-primary">{goal.progressPercent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${goal.progressPercent}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                          <span>{streakIcon(goal.currentStreak)} {goal.currentStreak > 0 ? `${goal.currentStreak} day streak` : 'No streak'}</span>
                          <span>🏆 Best: {goal.longestStreak} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {goals.filter(g => g.status === 'active').length === 0 && (
                <p className="text-sm text-text-muted py-4 text-center">No active goals yet. Create one to get started!</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-display font-800 text-text-primary tracking-tight mb-3">Recommendations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button key={cat.label} className={`flex items-center gap-3 p-4 rounded-xl border border-border-base bg-bg-surface hover:shadow-md transition-all ${cat.bg}`}>
                    <div className={`w-10 h-10 rounded-lg ${cat.bg} flex items-center justify-center`}>
                      <Icon size={18} className={cat.color} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-text-primary">{cat.label}</p>
                      <p className="text-xs text-text-muted">View resources</p>
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleCreate} className="fixed bottom-20 right-6 md:bottom-6 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center hover:bg-primary-600 hover:shadow-xl transition-all">
            <Plus size={28} />
          </button>

          {showPremium && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
              <div className="bg-bg-surface rounded-xl max-w-sm w-full p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
                  <Lock size={24} className="text-primary-500" />
                </div>
                <h3 className="text-lg font-display font-800 text-text-primary">Upgrade to Premium</h3>
                <p className="text-sm text-text-secondary">Free tier is limited to 1 active goal. Upgrade to create unlimited goals.</p>
                <button onClick={handleUpgrade} disabled={upgrading} className="w-full py-3 rounded-lg bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{upgrading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}{upgrading ? 'Processing...' : 'Upgrade Now'}</button>
                <button onClick={() => setShowPremium(false)} className="text-sm font-semibold text-text-muted hover:text-text-secondary">Maybe later</button>
              </div>
            </div>
          )}

          {showActions && selectedGoal && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowActions(false)}>
              <div className="bg-bg-surface rounded-t-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="w-10 h-1 rounded-full bg-border-base mx-auto mb-4" />
                <h4 className="text-sm font-bold text-text-primary mb-4">{selectedGoal.title}</h4>
                <div className="space-y-1">
                  {[
                    { icon: TrendingUp, label: 'View Progress', color: 'text-text-primary' },
                    { icon: Pause, label: 'Pause Goal', color: 'text-text-primary' },
                    { icon: Archive, label: 'Archive', color: 'text-text-muted' },
                    { icon: CircleAlert, label: 'Delete Goal', color: 'text-error-500' },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button key={action.label} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-bg-elevated transition-colors">
                        <Icon size={18} className={action.color} />
                        <span className={`text-sm font-semibold ${action.color}`}>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setShowActions(false)} className="w-full text-center text-sm font-semibold text-text-muted mt-4 py-2">Cancel</button>
              </div>
            </div>
          )}
          <div className="h-20" />
        </>
      )}
    </div>
  );
}
