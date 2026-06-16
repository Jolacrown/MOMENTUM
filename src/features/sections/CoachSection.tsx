'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Target, TrendingUp, Flame, BookOpen,
  GraduationCap, Users, Monitor, Send, Lock, Crown,
} from 'lucide-react';
import { CoachMessageBubble } from '@/components/web/CoachMessageBubble';
import { UserMessageBubble } from '@/components/web/UserMessageBubble';
import { useAuthStore } from '@/stores/web/auth-store-web';
import { openFlutterwaveCheckout } from '@/lib/payments/flutterwave-checkout';
import { supabase } from '@/lib/supabase-web';
import { getGoals } from '@/features/goals/goals.service';
import { getUserStreak } from '@/features/streaks/streak.service';
import { getRecentCheckinCount } from '@/features/checkins/checkin.service';
import { getRandomFallback } from '@/lib/coach';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp?: string; }

const SUGGESTED_ACTIONS = [
  { label: 'What should I focus on today?', icon: Target },
  { label: 'Analyze my progress', icon: TrendingUp },
  { label: 'Help me recover my streak', icon: Flame },
  { label: 'Recommend resources', icon: BookOpen },
];

const AI_INSIGHTS = [
  { label: 'Consistency Score', description: '87% this week — steady improvement', icon: TrendingUp },
  { label: 'Streak Status', description: '5-day streak — at-risk, complete today', icon: Flame },
  { label: 'Weekly Goal Progress', description: '3 of 5 check-ins completed', icon: Target },
  { label: 'Resource Engagement', description: '2 articles saved this week', icon: BookOpen },
];

const RESOURCE_ITEMS = [
  { icon: GraduationCap, label: 'Courses', count: 12, color: 'text-info-500' },
  { icon: BookOpen, label: 'Articles', count: 8, color: 'text-primary-500' },
  { icon: Users, label: 'Mentors', count: 3, color: 'text-accent-purple' },
  { icon: Monitor, label: 'Tools', count: 6, color: 'text-success-500' },
];

const FREE_MESSAGE_LIMIT = 3;

export function CoachSection() {
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showPremium, setShowPremium] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isPremium = !!(user?.app_metadata?.isPremium || user?.user_metadata?.isPremium);
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  const [userContext, setUserContext] = useState({
    name: displayName,
    skillLevel: user?.user_metadata?.skillLevel || 'Beginner',
    learningStyle: user?.user_metadata?.learningStyle || 'Mixed',
    goals: [] as { title: string; progressPercent: number; status: string }[],
    currentStreak: 0,
    longestStreak: 0,
    recentMood: 'Unrecorded' as string | undefined,
    recentCheckins: 0,
  });

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const [goalData, streakData, checkinCount] = await Promise.all([
          getGoals(user.id),
          getUserStreak(user.id),
          getRecentCheckinCount(user.id),
        ]);
        setUserContext((prev) => ({
          ...prev,
          goals: (goalData || []).map((g) => ({
            title: g.title,
            progressPercent: g.progress_percent,
            status: g.status,
          })),
          currentStreak: streakData?.current_streak || 0,
          longestStreak: streakData?.longest_streak || 0,
          recentCheckins: checkinCount,
        }));
      } catch {
        // use defaults
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const msg: Message = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role, content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, msg]);
  };

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();

    if (!isPremium && messageCount >= FREE_MESSAGE_LIMIT) {
      setShowPremium(true);
      return;
    }

    setInput('');
    addMessage('user', text);
    setMessageCount((c) => c + 1);
    if (!conversationStarted) setConversationStarted(true);
    setIsLoading(true);

    try {
      const history = [...messages, { id: '', role: 'user' as const, content: text, timestamp: '' }];
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      addMessage('assistant', data.content);
    } catch {
      addMessage('assistant', getRandomFallback());
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (label: string) => setInput(label);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="h-full flex flex-col">
      {!conversationStarted ? (
        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="bg-bg-surface rounded-xl p-6 border border-border-base shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-display font-800 text-text-primary">Hi, I&apos;m your AI Coach</h2>
              <p className="text-sm text-text-secondary mt-1">I&apos;m here to help you stay accountable, track your progress, and reach your goals. What&apos;s on your mind today?</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface border border-border-base">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary-500" />
              <span className="text-xs text-text-secondary">{userContext.currentStreak}-day streak</span>
            </div>
            <span className="w-px h-4 bg-border-base" />
            <span className="text-xs text-text-secondary">{userContext.recentCheckins} check-ins</span>
            <span className="w-px h-4 bg-border-base" />
            <span className="text-xs text-text-secondary">{userContext.goals.length} goals active</span>
            {!isPremium && (
              <>
                <span className="w-px h-4 bg-border-base" />
                <span className="text-xs text-text-muted">{Math.max(0, FREE_MESSAGE_LIMIT - messageCount)}/{FREE_MESSAGE_LIMIT} messages left</span>
              </>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold font-display text-text-primary mb-3">Your Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AI_INSIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl bg-bg-surface border border-border-base">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold font-display text-text-primary mb-3">Suggested Actions</h3>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.label} onClick={() => handleAction(action.label)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-surface border border-border-base text-xs font-semibold text-text-secondary hover:border-primary-300 hover:shadow-md transition-all">
                    <Icon size={14} className="text-primary-500" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold font-display text-text-primary mb-3">Quick Resources</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RESOURCE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-surface border border-border-base hover:shadow-md transition-all">
                    <Icon size={20} className={item.color} />
                    <span className="text-xs font-bold text-text-primary">{item.label}</span>
                    <span className="text-[10px] text-text-muted">{item.count} available</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-bg-surface rounded-xl border border-border-base p-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask your coach anything..." className="flex-1 px-3 py-2 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted" />
            <button onClick={handleSend} disabled={!input.trim()} className="w-10 h-10 rounded-lg bg-primary-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-600 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((msg) =>
              msg.role === 'assistant' ? (
                <CoachMessageBubble key={msg.id} content={msg.content} timestamp={msg.timestamp} />
              ) : (
                <UserMessageBubble key={msg.id} content={msg.content} timestamp={msg.timestamp} />
              )
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <span className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                Coach is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2 bg-bg-surface rounded-xl border border-border-base p-2 mt-auto">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." className="flex-1 px-3 py-2 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted" disabled={isLoading} />
            <button onClick={handleSend} disabled={!input.trim() || isLoading} className="w-10 h-10 rounded-lg bg-primary-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-600 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {showPremium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-bg-surface rounded-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
              <Lock size={24} className="text-primary-500" />
            </div>
            <h3 className="text-lg font-display font-800 text-text-primary">Upgrade to Premium</h3>
            <p className="text-sm text-text-secondary">Free tier is limited to {FREE_MESSAGE_LIMIT} coach messages. Upgrade for unlimited AI coaching conversations.</p>
            <button onClick={handleUpgrade} disabled={upgrading} className="w-full py-3 rounded-lg bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {upgrading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Crown size={16} />}
              {upgrading ? 'Processing...' : 'Upgrade Now — ₦1,200/mo'}
            </button>
            <button onClick={() => setShowPremium(false)} className="text-sm font-semibold text-text-muted hover:text-text-secondary">Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}
