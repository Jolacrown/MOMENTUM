---
#name: screen-builder

#description: Builds full screens and pages for Momentum — combining components, hooks, API calls, and state management into complete, production-ready views. Use this skill when creating or modifying any full-screen UI.

---

## What This Skill Does

Generates complete, production-ready screens for Momentum. Each screen is composed from shared components, feature-specific logic, API data fetching, and navigation wiring. Screens are mobile-first (320px min-width), dark-mode-only, and optimised for low-bandwidth environments (Nigeria Phase 1).

---

## When to Load

- Building a new page or screen from scratch
- Building a new page or screen from scratch
- Adding data fetching, state management, or navigation to a screen
- Implementing onboarding wizards, check-in flows, dashboard views, or premium gating
- Any task that produces a full UI view

---

## Screen Directory Structure

```
/src/features
  /onboarding
    screens/
      step-name.tsx
      step-goal.tsx
      step-skill-level.tsx
      step-learning-style.tsx
      step-daily-time.tsx
      step-reminder-time.tsx
      step-consent.tsx             ← step 7: GDPR/NDPR consent (mandatory)
  /checkins
    screens/
      daily-checkin.tsx
      checkin-history.tsx
  /dashboard
    screens/
      dashboard.tsx
      weekly-summary.tsx
      monthly-summary.tsx
  /goals
    screens/
      goal-list.tsx
      goal-create.tsx
      goal-detail.tsx
  /coach
    screens/
      coach-chat.tsx
  /streaks
    screens/
      streak-history.tsx           ← detail view with calendar heatmap
  /recommendations
    screens/
      recommendation-list.tsx
  /reports
    screens/
      weekly-report.tsx
      monthly-report.tsx
  /auth
    screens/
      login.tsx
      signup.tsx
      forgot-password.tsx
      reset-password.tsx
  /account
    screens/
      profile.tsx
      settings.tsx
      notification-preferences.tsx
      subscription-status.tsx      ← current tier + expiry + cancel option
      cancel-subscription.tsx      ← confirmation screen
  /payments
    screens/
      upgrade.tsx
      billing-history.tsx
```

---

## TypeScript Types (Shared)

```ts
// src/types/screens.ts

interface ScreenProps<Params = Record<string, never>> {
  params: Params;
}

interface PageProps<Params = Record<string, never>> {
  params: Params;
}

interface ScreenState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  isEmpty: boolean;
}

interface DashboardData {
  streak: StreakDisplay;
  weekSummary: WeekSummary;
  moodTrend: { date: string; mood: number }[];
  nextAction: string;
  userState: UserStatus;
}

interface StreakDisplay {
  current: number | '—';
  longest: number;
  daysSinceLast: number | null;
  atRisk: boolean;
}

interface WeekSummary {
  totalCheckins: number;
  completionRate: number;
  averageMood: number | null;
  averageEffort: number | null;
  bestGoal: { goalId: string; title: string; count: number } | null;
}

type UserStatus = 'onboarding' | 'active' | 'inactive' | 'streak-broken' | 'recovering' | 'milestone-reached' | 'churn-risk';
```

---

---

## Screen Template (Next.js Web)

```tsx
// src/app/(app)/checkin/page.tsx
'use client';

import { useState } from 'react';
import { useCheckin } from '@/features/checkins/hooks/use-checkin';
import { MoodSelector } from '@/components/MoodSelector';
import { TaskToggle } from '@/components/TaskToggle';
import { NotesInput } from '@/components/NotesInput';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { ErrorBanner } from '@/components/ErrorBanner';
import { useOfflineBanner } from '@/hooks/use-offline-banner';

export default function CheckinPage() {
  const { submit, isSubmitting, error, isLoading, goals } = useCheckin();
  const isOffline = useOfflineBanner();
  const [mood, setMood] = useState(3);
  const [effort, setEffort] = useState(2);
  const [notes, setNotes] = useState('');
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorBanner message={error} onRetry={() => {}} />;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {isOffline && (
        <div className="bg-warning-500/10 border border-warning-500 rounded-md px-4 py-2 mb-4">
          <p className="text-sm text-warning-500">You're offline. Your check-in saves when you reconnect.</p>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Today's Check-in</h1>

      {goals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-textSecondary">Nothing to track yet</p>
          <p className="text-sm text-textMuted mt-2">Create a goal to start checking in</p>
        </div>
      ) : (
        goals.map((goal) => (
          <TaskToggle
            key={goal.id}
            label={goal.title}
            checked={completedTasks[goal.id] ?? false}
            onChange={(val) => setCompletedTasks((prev) => ({ ...prev, [goal.id]: val }))}
          />
        ))
      )}

      <MoodSelector value={mood} onChange={setMood} />
      <NotesInput value={notes} onChange={setNotes} maxLength={500} />

      <Button onClick={() => submit({ mood, effort, notes, completedTasks })} disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Complete Check-in'}
      </Button>
    </main>
  );
}
```

### Import Convention

All screens import design tokens from `@/styles/tokens`. Never hardcode colours, spacing, or font sizes. See `design-system.md` for the full token reference.

```ts
import { tokens } from '@/styles/tokens';
// Usage: { backgroundColor: tokens.bgSurface }
```

---

## Screen States

Every screen must handle these states. The `ScreenState<T>` type captures them:

| State | What to Show | Token / Component |
|---|---|---|
| **Loading** | Skeleton card matching real content dimensions | `<Skeleton />` (shimmer, 1.5s loop) |
| **Empty** | Illustration + headline + CTA | See empty state table below |
| **Error** | ErrorBanner with retry + offline fallback | `<ErrorBanner message onRetry />`, bg `error500` only for system errors |
| **Success** | Normal content render | — |
| **Refreshing** | Silent background reload | `swr` revalidate |
| **Offline** | Persistent non-dismissible banner at top | `warning500` background, `text-sm` |

### Empty States per Screen

| Screen | Headline | Subtitle | CTA |
|---|---|---|---|
| Dashboard | "Let's build momentum" | "Complete your first check-in to see your progress." | Start Check-In |
| Goal List | "Nothing to work toward yet — let's fix that." | "Set a goal to start tracking." | Create Your First Goal |
| Check-in History | "No check-ins yet" | "Today's a good day to start." | Complete Today |
| Streak History | "Your streak starts the moment you do." | "Consistency builds momentum." | Complete Today |
| Recommendations | "We're finding the right resources for you." | "Check back soon for personalised recommendations." | (none — auto-refresh) |
| Coach Chat | "Say hello to your AI coach" | "I'm here to help you stay on track." | Start a Conversation |
| Weekly Report | "Not enough data yet" | "Check back after a few check-ins." | Go to Dashboard |
| Billing History | "No payments yet" | "Upgrade to Premium to unlock advanced features." | View Plans |

---

## Data Fetching Pattern

All screens use TanStack Query for server state. Never fetch directly inside a screen component:

```tsx
// hooks/use-checkin.ts — co-located hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CheckinInput {
  mood: number;
  effort: number;
  notes: string;
  completedTasks: Record<string, boolean>;
}

export function useCheckin() {
  const queryClient = useQueryClient();

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', 'active'],
    queryFn: () => api.get('/api/goals'),
    staleTime: 1000 * 60 * 5,   // 5 min
  });

  const { data: todayCheckin, isLoading: checkinLoading } = useQuery({
    queryKey: ['checkins', 'today'],
    queryFn: () => api.get('/api/checkins/today'),
    staleTime: 1000 * 60,        // 1 min
  });

  const mutation = useMutation({
    mutationFn: (data: CheckinInput) => api.post('/api/checkins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['streaks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    goals,
    todayCheckin,
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error?.message ?? null,
    isLoading: goalsLoading || checkinLoading,
  };
}
```

---

## Dashboard Screen — State Variants

The dashboard is the most stateful screen. Render different content based on user state:

```tsx
// src/features/dashboard/screens/dashboard.tsx

function DashboardScreen() {
  const { data, isLoading, error, userState } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={() => {}} />;

  switch (userState) {
    case 'onboarding':
      return <OnboardingPrompt />;               // "Finish setting up your profile"

    case 'active':
      return <ActiveDashboard data={data} />;     // Full dashboard with streak, mood, next action

    case 'streak-broken':
      return (
        <View>
          <RecoveryBanner message="Momentum pauses. It doesn't disappear." />
          <ActiveDashboard data={data} />         // Show muted streak badge
        </View>
      );

    case 'recovering':
      return (
        <View>
          <RecoveryBanner message={`Day ${data.streak.current} — you're building back.`} />
          <ActiveDashboard data={data} />
        </View>
      );

    case 'milestone-reached':
      return <MilestoneOverlay days={data.streak.current} onDismiss={() => {}} />;

    case 'inactive':
      return (
        <InactiveState
          message="It's been a while. Every day is a chance to restart."
          onCheckin={() => {}}
        />
      );

    case 'churn-risk':
      return (
        <InactiveState
          message="We miss you. One check-in is all it takes to come back."
          urgency="high"
          onCheckin={() => {}}
        />
      );

    default:
      return <ActiveDashboard data={data} />;
  }
}
```

---

## Premium Gating Patterns

Per AGENTS.md §12, free users have limited access. Use `PremiumGate` component (see `component-builder` skill) to conditionally gate features:

| Gating Point | Free Behaviour | Premium Behaviour |
|---|---|---|
| **Add Goal button** | Show PremiumGate when at free-tier limit (1 active goal) | Full access |
| **AI Coach** | 5 messages/day, then PremiumGate | Unlimited messages |
| **Dashboard analytics** | Basic (streak + week summary) | Deep analytics + mood trends + PDF export |
| **Reports** | PremiumGate on weekly/monthly report pages | Full access |

```tsx
// PremiumGate pattern
import { PremiumGate } from '@/components/PremiumGate';

function GoalListScreen() {
  const { goals, isPremium } = useGoals();

  return (
    <View>
      {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}

      {isPremium || goals.length < 1 ? (
        <Button title="Add Goal" onPress={navigateToCreateGoal} />
      ) : (
        <PremiumGate feature="Unlimited Goals" />    // Blurred preview + "Unlock Premium" CTA
      )}
    </View>
  );
}
```

---

## Streak Display Rules (from AGENTS.md §11 + design-system.md §Streak)

| Rule | Implementation |
|---|---|
| Never show `"0"` for a never-started streak | Display `"—"` instead |
| Active streak | `primary500` (orange) with pulse animation |
| At-risk (1 missed day) | `warning500` (yellow), no pulse |
| Broken (2+ missed) | `borderLight` (muted), no animation |
| Streak count copy | `"{count} day{plural}"` — never "you failed" |
| Missed streak copy | `"Momentum pauses. It doesn't disappear."` |

```tsx
// components/StreakBadge.tsx  (see component-builder for full spec)
function StreakBadge({ current, atRisk, isBroken }: StreakBadgeProps) {
  const displayValue = current === 0 ? '—' : String(current);
  const badgeColor = isBroken ? tokens.borderLight : atRisk ? tokens.warning500 : tokens.primary500;
  // ...
}
```

---

## Offline Handling

```tsx
// hooks/use-offline-banner.ts

import { useState, useEffect } from 'react';

export function useOfflineBanner(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'onLine' in navigator) {
      const onOffline = () => setIsOffline(true);
      const onOnline = () => setIsOffline(false);
      window.addEventListener('offline', onOffline);
      window.addEventListener('online', onOnline);
      setIsOffline(!navigator.onLine);
      return () => {
        window.removeEventListener('offline', onOffline);
        window.removeEventListener('online', onOnline);
      };
    }
  }, []);

  return isOffline;
}
```

See `design-system.md` §Offline & Connectivity UI for the full 6-scenario behavior table (loading, offline, slow connection, reconnection, failed mutation, offline check-in).

---

## Navigation Wiring

### Next.js (App Router)

```tsx
// src/app/(app)/layout.tsx — protected layout (redirects to /auth/login if no session)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Page routes under `(app)` mirror the feature structure:

```
/app/(app)/
  /dashboard
  /checkin
  /coach
  /goals/[id]
  /streaks/[userId]
  /account/settings
  /account/subscription
  /upgrade
```

---

## Optimisation Rules

- Lazy-load screens not immediately visible: `React.lazy(() => import('./screens/coach-chat'))`
- Prefetch critical data on navigation focus (not on mount): `usePrefetch` (Next.js)
- Use `React.memo` for screen-level components with expensive renders
- TanStack Query `staleTime`: dashboard 5 min, check-ins 1 min, streaks 5 min (backed by Redis), coach history 30s
- Offline: show last cached screen state with persistent offline banner (see `design-system.md` §Offline)
- Bundle size per screen: < 100KB (code-split by route)
- Minify and tree-shake all screen bundles

---

## Performance Targets

| Metric | Target |
|---|---|
| Screen render (mid-range Android) | < 500ms |
| Time to interactive (3G) | < 2s |
| Bundle size per screen | < 100KB |
| API data load | Show skeleton immediately, populate as data arrives |

---

## Design Rules Checklist (per `design-system.md`)

Before shipping any screen:

- [ ] Uses token values from `@/styles/tokens` — no hardcoded colours, spacing, or fonts
- [ ] Supports 320px minimum width (mobile-first)
- [ ] All touch targets ≥ 44×44px
- [ ] Handles loading state (skeleton matching content dimensions)
- [ ] Handles empty state (illustration + headline + CTA)
- [ ] Handles error state (user-friendly message + retry action)
- [ ] Handles offline state (persistent banner + cached data)
- [ ] Dark-theme only (no light mode for MVP)
- [ ] Reinforces encouraging tone (no guilt-based copy)
- [ ] One clear primary action per screen
- [ ] Streak badge follows display rules (never `"0"`, yellow for at-risk, never red)
- [ ] Premium features gated behind `PremiumGate` for free users
- [ ] Co-located hook handles data fetching (not in screen JSX)
- [ ] Analytics events tracked from hook layer (not from component)
- [ ] Accessible: screen reader labels, proper heading hierarchy, `accessibilityLabel` on icon buttons

If any item fails, the screen is not ready for release.

---

## Cross-References

| File / Resource | Why |
|---|---|
| `design-system.md` | Design tokens, component states (7-state anatomy), offline UI (6 scenarios), onboarding design (7 steps), streak display rules, premium UI, empty states, loading states, error states |
| `component-builder` skill | Full component props API: StreakBadge, MoodSelector, MilestoneOverlay, PremiumGate, GoalCard, Skeleton, ErrorBanner, Button |
| `architecture.md` | Route inventory, folder structure, error response shape `{ success, data, error }`, pagination envelope |
| `code-style.md` | Component/hook naming conventions, import order, testing patterns |
| `security.md` | Notes encryption (AES-256-GCM), PII rules, rate limiting on payment screens |
| `progress-tracker` skill | Streak engine, user state machine, dashboard data shape, mood aggregation, milestone trigger logic |
| `auth-system-builder` skill | User state management, onboarding state (status: onboarding → active), 7-step onboarding with consent |
| `flutterwave-integration` skill | Payment flow, upgrade screen wiring, subscription status |
| `AGENTS.md` | User states (§5), notification rules (§6), streak recovery (§11), monetisation tiers (§12), analytics events (§8), non-negotiable constraints |
| `api-route-scaffolder` skill | API route inventory, analytics events table, error codes (GOAL_LIMIT_REACHED, PREMIUM_REQUIRED) |
