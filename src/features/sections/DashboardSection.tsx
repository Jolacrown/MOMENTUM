'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Sparkles, Check, Clock, BookOpen, CalendarCheck, TrendingUp, Zap, Target, Activity } from 'lucide-react';
import { GoalCard } from '@/components/web/GoalCard';
import { CoachMessageBubble } from '@/components/web/CoachMessageBubble';
import { MoodSelector } from '@/components/web/MoodSelector';
import { useAuthStore } from '@/stores/web/auth-store-web';
import { getGoals } from '@/features/goals/goals.service';
import { getUserStreak } from '@/features/streaks/streak.service';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EFFORT_LEVELS = [
  { value: 1, label: 'Minimal' }, { value: 2, label: 'Light' },
  { value: 3, label: 'Moderate' }, { value: 4, label: 'High' }, { value: 5, label: 'Maximum' },
];

const FALLBACK_GOALS = [
  { title: 'Learn UI/UX Design', progressPercent: 25, streak: 5 },
  { title: 'Master React Native', progressPercent: 15, streak: 3 },
  { title: 'Read 12 Books', progressPercent: 42, streak: 7 },
];

interface DisplayGoal { title: string; progressPercent: number; streak: number; }

export function DashboardSection() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [checkedIn, setCheckedIn] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [effort, setEffort] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [goals, setGoals] = useState<DisplayGoal[]>(FALLBACK_GOALS);
  const [streak, setStreak] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    const fetch = async () => {
      try {
        const [goalData, streakData] = await Promise.all([
          getGoals(user.id),
          getUserStreak(user.id),
        ]);
        if (!cancelled) {
          if (goalData && goalData.length > 0) {
            setGoals(goalData.map((g) => ({
              title: g.title,
              progressPercent: g.progress_percent,
              streak: 0,
            })));
          }
          if (streakData) setStreak(streakData.current_streak);
        }
      } catch { /* fallback */ }
      if (!cancelled) setLoading(false);
    };
    fetch();
    return () => { cancelled = true; };
  }, [user?.id]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-800 text-text-primary tracking-tight">{getGreeting()}, TJ</h1>
        <p className="text-sm text-text-muted mt-1.5">{formatDate()}</p>
        <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-4 py-3 mt-4">
          <Flame size={18} className="text-primary-500 fill-primary-500" />
          <p className="text-sm text-text-secondary flex-1 leading-5">
            You&apos;re <span className="font-bold font-display text-primary-600">1 task</span> away from extending your{' '}
            <span className="font-bold font-display text-primary-600">{streak}-day streak</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-28 h-28 rounded-full border-[2.5px] border-primary-500 bg-primary-500/12 flex items-center justify-center animate-glow-pulse">
            <span className="text-[38px] font-display font-800 text-primary-500">{streak}</span>
          </div>
          <span className="text-xs font-bold text-text-muted">day streak</span>
        </div>
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[
            { icon: CalendarCheck, value: `${streak}/7`, label: 'This Week', bg: 'bg-info-50', color: 'text-info-500' },
            { icon: TrendingUp, value: '71%', label: 'Completion', bg: 'bg-success-50', color: 'text-success-500' },
            { icon: Zap, value: `${Math.max(streak, 14)}`, label: 'Longest Streak', bg: 'bg-error-50', color: 'text-error-500' },
            { icon: Target, value: '87%', label: 'Accountability', bg: 'bg-primary-50', color: 'text-primary-500' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-bg-surface rounded-xl p-5 border border-border-base shadow-sm hover:border-primary-300 hover:shadow-md transition-all duration-200 group">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                  <Icon size={20} className={item.color} />
                </div>
                <p className="text-2xl font-display font-800 text-text-primary tracking-tight">{item.value}</p>
                <p className="text-xs font-semibold text-text-secondary">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-primary-600 rounded-[20px] p-7 lg:p-8 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-white/80" />
                <span className="text-xs font-bold font-display text-white/80 tracking-wider">TODAY&apos;S FOCUS</span>
              </div>
              <span className="text-lg font-display font-800 text-white">25%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-1 w-fit">
              <BookOpen size={14} className="text-white/90" />
              <span className="text-xs font-bold font-display text-white/90">Learn UI/UX Design</span>
            </div>
            <p className="text-2xl lg:text-3xl font-display font-800 text-white leading-8 lg:leading-10 tracking-tight">Complete color palette exercise</p>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-white/70" />
              <span className="text-sm text-white/70 font-medium">~20 min</span>
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <span className="text-sm text-white/70 font-medium">Step 1 of 4</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="w-1/4 h-full bg-white rounded-full" />
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-white rounded-xl py-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <Check size={20} className="text-primary-700" />
              <span className="text-base font-display font-800 text-primary-700">Complete Today&apos;s Action</span>
            </button>
          </div>

          <div>
            <h3 className="text-lg font-display font-800 text-text-primary tracking-tight mb-3">Daily Check-In</h3>
            <div className="bg-bg-surface rounded-xl p-5 lg:p-6 border border-border-base shadow-sm space-y-4">
              <button
                onClick={() => setCheckedIn(!checkedIn)}
                className={`w-full flex items-center gap-3 pb-4 border-b transition-colors ${checkedIn ? 'border-primary-100' : 'border-border-base'}`}
              >
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checkedIn ? 'bg-success-500 border-success-500' : 'border-border-light'}`}>
                  {checkedIn && <Check size={14} strokeWidth={3} className="text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-bold font-display tracking-tight ${checkedIn ? 'text-success-500 line-through' : 'text-text-primary'}`}>Learn UI/UX Design</p>
                  <p className="text-xs text-text-muted mt-1">{checkedIn ? "Today's task completed!" : 'Complete your daily action'}</p>
                </div>
              </button>
              <MoodSelector selectedMood={mood} onSelect={setMood} />
              <div>
                <p className="text-sm font-semibold text-text-primary mb-2">Effort level today</p>
                <div className="flex gap-2">
                  {EFFORT_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setEffort(level.value)}
                      className={`flex-1 text-center py-2.5 rounded-md transition-all duration-200 ${effort === level.value ? 'bg-primary-50 border border-primary-300' : 'bg-bg-elevated hover:border hover:border-primary-300 hover:shadow-md'}`}
                    >
                      <span className={`text-[10px] font-semibold ${effort === level.value ? 'text-primary-500 font-bold' : 'text-text-muted'}`}>{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it go? Any reflections..."
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm min-h-[60px] resize-none outline-none focus:border-primary-500 transition-colors placeholder:text-text-muted"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <Sparkles size={18} className="text-primary-500" />
              <h3 className="text-lg font-display font-800 text-text-primary tracking-tight"> Coach Insight</h3>
            </div>
            <button onClick={() => router.push('/app?view=coach')} className="w-full text-left">
              <CoachMessageBubble content="You're on a 5-day streak! Consistency beats intensity — keep showing up. Today's color palette exercise will strengthen your design fundamentals." />
            </button>
            <div className="flex items-start gap-2 mt-3 px-1">
              <Sparkles size={14} className="text-primary-500 mt-0.5" />
              <p className="text-sm text-text-secondary leading-5">
                <span className="font-bold text-text-primary">Next best action: </span>
                Complete your daily check-in after finishing the exercise.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-3">
              <Activity size={18} className="text-text-primary" />
              <h3 className="text-lg font-display font-800 text-text-primary tracking-tight flex-1"> Weekly Consistency</h3>
              <span className="text-xs font-semibold text-text-secondary">Target: 5 days</span>
            </div>
            <div className="bg-bg-surface rounded-xl p-5 lg:p-6 border border-border-base shadow-sm mb-3">
              <div className="flex justify-between">
                {WEEK_DAYS.map((day, index) => (
                  <div key={day} className="flex flex-col items-center gap-2 group">
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${index < streak ? 'bg-success-500 border-success-500' : 'border-border-light group-hover:border-primary-300'}`}>
                      {index < streak && <Check size={12} strokeWidth={3} className="text-white" />}
                    </div>
                    <span className={`text-[11px] font-semibold ${index < streak ? 'text-text-primary font-bold' : 'text-text-muted'}`}>{day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                <div className={`h-full rounded-full bg-primary-500`} style={{ width: `${Math.min((streak / 5) * 100, 100)}%` }} />
              </div>
              <span className="text-sm font-semibold text-text-secondary">{Math.min(streak, 5)} of 5 days</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-display font-800 text-text-primary tracking-tight">Active Goals</h3>
              <button onClick={() => router.push('/app?view=goals')} className="text-sm font-bold text-primary-500 hover:text-primary-400">View All</button>
            </div>
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <GoalCard key={index} title={goal.title} progressPercent={goal.progressPercent} status="active" streak={goal.streak} onPress={() => router.push('/app?view=goals')} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-10" />
    </div>
  );
}
