'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-web';

const TOTAL_STEPS = 7;

const STEP_CONFIG = [
  { title: "What's your name?", sub: "Let us know what to call you", field: 'name', type: 'text', placeholder: 'Enter your name' },
  { title: "What's your primary goal?", sub: "What do you want to achieve?", field: 'goal', type: 'text', placeholder: 'e.g. Learn UI/UX Design' },
  { title: "What's your skill level?", sub: "We'll tailor content for your level", field: 'skillLevel', type: 'option', options: ['Beginner', 'Intermediate', 'Advanced'] },
  { title: 'Preferred learning style?', sub: 'How do you learn best?', field: 'learningStyle', type: 'option', options: ['Visual', 'Reading', 'Hands-on'] },
  { title: 'Daily available time?', sub: 'How much time can you dedicate daily?', field: 'dailyTime', type: 'option', options: ['5 minutes', '15 minutes', '30 minutes', '1 hour+'] },
  { title: 'Reminder time?', sub: 'When should we check in with you?', field: 'reminderTime', type: 'time', placeholder: '08:00' },
  { title: 'One last thing', sub: 'We need your consent to personalize your experience', field: 'consent', type: 'consent' },
];

function mapSkillLevel(level: string): string {
  const map: Record<string, string> = { Beginner: 'beginner', Intermediate: 'intermediate', Advanced: 'advanced' };
  return map[level] || 'beginner';
}

function mapLearningStyle(style: string): string {
  const map: Record<string, string> = { Visual: 'video', Reading: 'reading', 'Hands-on': 'practice' };
  return map[style] || 'reading';
}

function parseDailyTime(time: string): number {
  const map: Record<string, number> = { '5 minutes': 5, '15 minutes': 15, '30 minutes': 30, '1 hour+': 60 };
  return map[time] || 15;
}

export default function OnboardingStep() {
  const router = useRouter();
  const params = useParams();
  const step = parseInt(params.step as string) || 1;

  const [data, setData] = useState({
    name: '', goal: '', skillLevel: '', learningStyle: '',
    dailyTime: '', reminderTime: '08:00', consent: false,
  });
  const [saving, setSaving] = useState(false);

  const setField = (field: string, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      router.push(`/onboarding/${step + 1}`);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    if (step > 1) router.push(`/onboarding/${step - 1}`);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to complete onboarding.');

      const skillLevel = mapSkillLevel(data.skillLevel);
      const learningStyle = mapLearningStyle(data.learningStyle);
      const dailyTimeMinutes = parseDailyTime(data.dailyTime);

      const { error: userError } = await supabase
        .from('users')
        .update({
          name: data.name,
          skill_level: skillLevel,
          learning_style: learningStyle,
          daily_time_minutes: dailyTimeMinutes,
          reminder_time: data.reminderTime,
          onboarding_step: 7,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      const { error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: data.goal,
          status: 'active',
        });

      if (goalError) throw goalError;

      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: data.name }),
      }).catch((e) => console.error('[welcome-email]', e));

      router.replace('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save your preferences';
      alert(msg);
      setSaving(false);
    }
  };

  const current = STEP_CONFIG[step - 1];
  const isDisabled = () => {
    if (step === 1 && !data.name) return true;
    if (step === 2 && !data.goal) return true;
    if (step === 3 && !data.skillLevel) return true;
    if (step === 4 && !data.learningStyle) return true;
    if (step === 5 && !data.dailyTime) return true;
    if (step === 6 && !data.reminderTime) return true;
    if (step === 7 && !data.consent) return true;
    return false;
  };

  if (!current) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <p className="text-text-muted">Invalid step</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-12">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-12">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full transition-all duration-300 ${i < step ? 'w-7 bg-primary-500' : 'w-2.5 bg-border-base'}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-2xl font-display font-800 text-text-primary tracking-tight mb-2">{current.title}</h2>
          <p className="text-sm text-text-secondary mb-6">{current.sub}</p>

          {current.type === 'text' && (
            <input
              type="text"
              value={(data as any)[current.field] as string}
              onChange={(e) => setField(current.field, e.target.value)}
              placeholder={current.placeholder}
              className="w-full px-4 py-3.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm outline-none focus:border-primary-500 transition-colors placeholder:text-text-muted"
              autoFocus
            />
          )}

          {current.type === 'time' && (
            <input
              type="time"
              value={(data as any)[current.field] as string}
              onChange={(e) => setField(current.field, e.target.value)}
              className="w-full px-4 py-3.5 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm outline-none focus:border-primary-500 transition-colors"
              autoFocus
            />
          )}

          {current.type === 'option' && (
            <div className="space-y-3">
              {(current.options || []).map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => setField(current.field, opt)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                    (data as any)[current.field] === opt
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-border-base bg-bg-surface hover:border-primary-300'
                  }`}
                >
                  <span className={`text-sm font-semibold ${(data as any)[current.field] === opt ? 'text-primary-500' : 'text-text-secondary'}`}>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          )}

          {current.type === 'consent' && (
            <button
              onClick={() => setField('consent', !data.consent)}
              className={`w-full px-5 py-5 rounded-xl border transition-all duration-200 ${
                data.consent ? 'border-primary-500 bg-primary-50' : 'border-border-base bg-bg-surface'
              }`}
            >
              <span className="text-sm font-semibold text-text-primary">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 ? (
            <button onClick={goBack} className="flex-1 py-3.5 rounded-lg border border-border-base text-sm font-semibold text-text-secondary hover:bg-bg-elevated transition-colors">
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={goNext}
            disabled={isDisabled() || saving}
            className="flex-1 py-3.5 rounded-lg bg-primary-500 text-white text-sm font-bold disabled:opacity-40 hover:bg-primary-600 transition-colors"
          >
            {saving ? 'Saving...' : step === TOTAL_STEPS ? 'Get Started' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
