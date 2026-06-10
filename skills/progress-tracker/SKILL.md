---
#name: progress-tracker

#description: Builds streak tracking, progress dashboards, milestone celebrations, mood charts, and user state transitions for Momentum. Use this skill when scaffolding or modifying anything related to user progress, streaks, check-in analytics, dashboard visualisation, or state machine logic.

---

## What This Skill Does

Implements the full progress-tracking layer for Momentum: the streak engine (with recovery, no harsh resets), daily check-in processing, milestone detection, mood chart aggregation, progress dashboard APIs, the user state machine, and the background jobs that drive it all.

---

## When to Load

- Building or modifying `POST /api/checkins` or `GET /api/checkins`
- Building `GET /api/streaks/:userId` or any streak-related logic
- Building the progress dashboard (`GET /api/dashboard`, weekly/monthly summaries)
- Detecting and broadcasting milestones (3, 7, 14, 21, 30, 60, 100, 365 days)
- Implementing the user state machine transitions
- Building the `StreakBadge`, `MoodSelector`, or `MilestoneOverlay` components
- Setting up the cron jobs for streak-break and churn-risk detection
- Any task that references user states `streak-broken`, `recovering`, `milestone-reached`, or `churn-risk`

---

## 1. Canonical Schemas (from `db-migration-runner`)

```prisma
model Checkin {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  goalId        String    @map("goal_id")
  date          DateTime  @db.Date                // date only, no time
  taskCompleted Boolean   @default(false) @map("task_completed")
  mood          Int?                              // 1–5
  notes         String?                           // encrypted at app layer (AES-256-GCM)
  effortLevel   Int?      @map("effort_level")   // 1=low, 2=medium, 3=high
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal          Goal      @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@unique([userId, goalId, date])               // idempotency — one check-in per goal per day
  @@index([userId, date])
  @@index([goalId])
  @@map("checkins")
}

model Streak {
  id                String    @id @default(uuid())
  userId            String    @unique @map("user_id")
  currentStreak     Int       @default(0) @map("current_streak")
  longestStreak     Int       @default(0) @map("longest_streak")
  recoveryStreak    Int       @default(0) @map("recovery_streak")
  lastCompletedDate DateTime? @db.Date @map("last_completed_date")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("streaks")
}
```

All streak values are stored as `Int`. Never display `0` to the user — show `"—"` for never-started streaks (see `design-system.md` StreakBadge spec).

---

## 2. User State Machine

These map to AGENTS.md §5 and are driven by the progress tracker:

```
onboarding ──► active ──► inactive ──► churn-risk
                  │                        │
                  ▼                        │
           streak-broken ◄─────────────────┘
                  │
                  ▼
             recovering ──► active (back on track)
                  │
                  ▼
         milestone-reached
```

### State Transitions

| From | To | Trigger | Implementation |
|---|---|---|---|
| `onboarding` | `active` | Onboarding completed (`POST /api/onboarding/complete`) | `db.user.update({ status: 'active' })` |
| `active` | `streak-broken` | 2+ consecutive days with no check-in (cron) | `updateStreakAndState()` in cron job |
| `active` | `inactive` | 14 days with no check-in (cron) | `db.user.update({ status: 'inactive' })` |
| `inactive` | `churn-risk` | 5+ additional days (19 total) with no check-in | `db.user.update({ status: 'churn_risk' })` + analytics |
| `streak-broken` | `recovering` | First check-in after streak break | `updateStreakAndState()` on check-in |
| `recovering` | `active` | 3 consecutive check-ins completed | `updateStreakAndState()` on 3rd consecutive check-in |
| `recovering` | `active` | Or: recovery streak reaches 3 | Same logic via `recoveryStreak` |
| `active` or `recovering` | `milestone-reached` | Streak hits 3, 7, 14, 21, 30, 60, 100, 365 | `detectAndBroadcastMilestone()` on check-in |
| `milestone-reached` | `active` | Immediately after celebration (transient state) | State reverts to previous state after analytics event |
| `churn-risk` or `inactive` | `active` | User returns and completes a check-in | `updateStreakAndState()` on check-in |

---

## 3. Streak Engine

The streak engine is the core — called from `POST /api/checkins` and from the cron job that detects missed days.

### 3.1 Check-In: Update Streak

```ts
// lib/streaks/engine.ts

import { startOfDay, differenceInCalendarDays, addDays } from 'date-fns';

const MISSED_THRESHOLD = 2;  // AGENTS.md §11: break after 2+ consecutive misses
const RECOVERY_TARGET = 3;   // 3 consecutive check-ins restores active status

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  recoveryStreak: number;
  stateChanged: boolean;
  newState: UserStatus;
  milestoneHit: number | null;
}

export async function updateStreakAndState(userId: string, today: Date): Promise<StreakResult> {
  const prevStreak = await db.streak.findUnique({ where: { userId } });
  const yesterday = addDays(today, -1);

  if (!prevStreak || !prevStreak.lastCompletedDate) {
    // First ever check-in — start streak at 1
    await upsertStreak(userId, 1, 1, 0, today);
    await updateUserState(userId, 'active', prevStreak?.userId);
    const milestone = detectMilestone(1);
    return { currentStreak: 1, longestStreak: 1, recoveryStreak: 0, stateChanged: true, newState: 'active', milestoneHit: milestone };
  }

  const daysSinceLast = differenceInCalendarDays(today, prevStreak.lastCompletedDate);

  if (daysSinceLast === 0) {
    // Same-day check-in (another goal) — no streak change
    return {
      currentStreak: prevStreak.currentStreak,
      longestStreak: prevStreak.longestStreak,
      recoveryStreak: prevStreak.recoveryStreak,
      stateChanged: false,
      newState: 'active',
      milestoneHit: null,
    };
  }

  if (daysSinceLast === 1) {
    // Consecutive day — increment streak
    const newCurrent = prevStreak.currentStreak + 1;
    const newLongest = Math.max(newCurrent, prevStreak.longestStreak);

    // Handle recovery: increment recovery streak if in recovering state
    const user = await db.user.findUnique({ where: { id: userId }, select: { status: true } });
    let newRecovery = prevStreak.recoveryStreak;
    let newState: UserStatus = 'active';
    let stateChanged = false;

    if (user?.status === 'recovering') {
      newRecovery += 1;
      if (newRecovery >= RECOVERY_TARGET) {
        newState = 'active';
        stateChanged = true;
      }
    }

    await upsertStreak(userId, newCurrent, newLongest, newRecovery, today);
    if (stateChanged) await updateUserState(userId, newState);

    const milestone = detectMilestone(newCurrent);
    return { currentStreak: newCurrent, longestStreak: newLongest, recoveryStreak: newRecovery, stateChanged, newState, milestoneHit: milestone };
  }

  // daysSinceLast > 1 — streak is broken
  // But: if daysSinceLast <= MISSED_THRESHOLD, it's "at-risk", not broken
  // AGENTS.md §11: "only break it after 2+ consecutive misses"

  if (daysSinceLast <= MISSED_THRESHOLD) {
    // At-risk — no change to streak, just update lastCompletedDate
    // This means 1 missed day = at-risk (yellow), 2+ = broken
    // Actually per AGENTS.md: break after 2+ consecutive misses
    // So 1 miss = at-risk (no reset), 2 misses = broken (reset to 0)
    await setStreakAtRisk(userId);
    return {
      currentStreak: prevStreak.currentStreak,
      longestStreak: prevStreak.longestStreak,
      recoveryStreak: prevStreak.recoveryStreak,
      stateChanged: false,
      newState: 'streak-broken', // signal — at-risk
      milestoneHit: null,
    };
  }

  // daysSinceLast > MISSED_THRESHOLD — break the streak
  // Reset to 0, but keep longest_streak intact
  const newRecovery = 0;  // recovery starts fresh
  await upsertStreak(userId, 0, prevStreak.longestStreak, newRecovery, today);
  await updateUserState(userId, 'streak-broken');

  // Track analytics
  await analytics.track('streak_broken', {
    userId,
    previousStreak: prevStreak.currentStreak,
    longestStreak: prevStreak.longestStreak,
    daysSinceLastCheckin: daysSinceLast,
  });

  return { currentStreak: 0, longestStreak: prevStreak.longestStreak, recoveryStreak: 0, stateChanged: true, newState: 'streak-broken', milestoneHit: null };
}

async function upsertStreak(userId: string, current: number, longest: number, recovery: number, date: Date) {
  await db.streak.upsert({
    where: { userId },
    create: { userId, currentStreak: current, longestStreak: longest, recoveryStreak: recovery, lastCompletedDate: date },
    update: { currentStreak: current, longestStreak: longest, recoveryStreak: recovery, lastCompletedDate: date },
  });
}

async function setStreakAtRisk(userId: string) {
  // At-risk is a UI state — no DB change needed
  // The frontend checks daysSinceLast to render yellow badge
}

async function updateUserState(userId: string, status: UserStatus) {
  await db.user.update({ where: { id: userId }, data: { status } });
}
```

### 3.2 Streak Visual States (from `design-system.md`)

| Condition | Design Token | Animation | Copy |
|---|---|---|---|
| Active streak | `primary500` (orange) | Pulse | `{count} day{plural} — keep going!` |
| At-risk (1 missed day) | `warning500` (yellow) | No pulse | `Almost there — today keeps it alive.` |
| Broken (2+ missed) | `borderLight` (muted) | None | `Momentum pauses. It doesn't disappear.` |
| Never started | `textMuted` | None | Show `"—"` not `"0"` |
| Milestone hit | `accentPurple` | Confetti (MilestoneOverlay) | Celebration copy |

---

## 4. Milestone Detection

```ts
// lib/streaks/milestones.ts

export const MILESTONE_DAYS = [3, 7, 14, 21, 30, 60, 100, 365];

export function detectMilestone(streakCount: number): number | null {
  if (MILESTONE_DAYS.includes(streakCount)) return streakCount;
  return null;
}

export async function triggerMilestone(userId: string, milestoneDay: number) {
  // Track analytics
  await analytics.track('milestone_reached', {
    userId,
    streakCount: milestoneDay,
    milestoneType: milestoneDay >= 365 ? 'year' : milestoneDay >= 30 ? 'month' : 'week',
  });

  // Trigger push notification (see notification skill)
  await notifyMilestone(userId, milestoneDay);
}
```

---

## 5. API Routes

All routes live in `src/features/progress/`.

```
POST   /api/checkins               → create check-in, update streak, detect milestone
GET    /api/checkins?userId=&date=&page=&limit=  ← paginated check-in history
GET    /api/checkins/today         → return today's check-in(s) for current user

GET    /api/streaks/:userId        ← cached in Redis, TTL 1 hour

GET    /api/dashboard              ← aggregate: streak + week summary + mood trend + next action
GET    /api/dashboard/weekly-summary  ← check-in %, mood avg, top goal, total check-ins (last 7 days)
GET    /api/dashboard/monthly-summary ← same shape, last 30 days
```

### 5.1 Check-In Route

```ts
// POST /api/checkins

const CheckinSchema = z.object({
  goalId: z.string().uuid(),
  taskCompleted: z.boolean(),
  mood: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
  effortLevel: z.number().int().min(1).max(3).optional(),
});

async function createCheckin(req, res) {
  const data = CheckinSchema.parse(req.body);
  const userId = req.user.id;
  const today = startOfDay(new Date());

  // Idempotency: one check-in per goal per day
  const existing = await db.checkin.findUnique({
    where: { userId_goalId_date: { userId, goalId: data.goalId, date: today } },
  });
  if (existing) throw new AppError('CHECKIN_EXISTS', 'You already checked in for this goal today.', 409);

  const checkin = await db.checkin.create({
    data: {
      userId,
      goalId: data.goalId,
      date: today,
      taskCompleted: data.taskCompleted,
      mood: data.mood,
      notes: data.notes,          // encrypted at app layer (see security.md)
      effortLevel: data.effortLevel,
    },
  });

  // Update streak and state
  const result = await updateStreakAndState(userId, today);

  // Track analytics
  await analytics.track('daily_checkin_completed', {
    userId, goalId: data.goalId, taskCompleted: data.taskCompleted, mood: data.mood, effortLevel: data.effortLevel,
  });

  // If streak started fresh (count === 1 after being 0), track it
  if (result.currentStreak === 1 && result.stateChanged) {
    await analytics.track('streak_started', { userId, streakCount: 1 });
  }

  // Milestone celebration
  if (result.milestoneHit) {
    await triggerMilestone(userId, result.milestoneHit);
  }

  return res.status(201).json({
    success: true,
    data: {
      checkin: sanitizeCheckin(checkin),
      streak: {
        current: result.currentStreak,
        longest: result.longestStreak,
        recovery: result.recoveryStreak,
        milestoneHit: result.milestoneHit,
      },
      userState: result.newState,
    },
  });
}
```

### 5.2 Streak Route

```ts
// GET /api/streaks/:userId — cached in Redis

async function getStreak(req, res) {
  const { userId } = req.params;
  const cacheKey = `streak:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return res.json({ success: true, data: JSON.parse(cached) });

  const streak = await db.streak.findUnique({ where: { userId } });
  if (!streak) {
    return res.json({
      success: true,
      data: { currentStreak: 0, longestStreak: 0, recoveryStreak: 0, lastCompletedDate: null, displayValue: '—' },
    });
  }

  const data = {
    ...streak,
    daysSinceLast: streak.lastCompletedDate
      ? differenceInCalendarDays(new Date(), streak.lastCompletedDate)
      : null,
    displayValue: streak.currentStreak > 0 ? streak.currentStreak : '—',
  };

  await redis.setex(cacheKey, 3600, JSON.stringify(data)); // TTL 1 hour
  return res.json({ success: true, data });
}
```

### 5.3 Dashboard Route

```ts
// GET /api/dashboard

interface DashboardData {
  streak: {
    current: number | '—';
    longest: number;
    daysSinceLast: number | null;
    atRisk: boolean;
  };
  weekSummary: {
    totalCheckins: number;
    completionRate: number;       // percentage
    averageMood: number | null;
    averageEffort: number | null;
    bestGoal: { goalId: string; title: string; count: number } | null;
  };
  moodTrend: { date: string; mood: number }[];  // last 7 days
  nextAction: string;             // derived from user state (see below)
  userState: UserStatus;
}

async function getDashboard(req, res) {
  const userId = req.user.id;
  const today = startOfDay(new Date());
  const weekAgo = addDays(today, -7);

  // Parallel fetch
  const [streak, weekCheckins, moodData, goals, user] = await Promise.all([
    db.streak.findUnique({ where: { userId } }),
    db.checkin.findMany({ where: { userId, date: { gte: weekAgo } }, include: { goal: { select: { title: true } } } }),
    db.checkin.findMany({ where: { userId, date: { gte: weekAgo }, mood: { not: null } }, orderBy: { date: 'asc' } }),
    db.goal.findMany({ where: { userId, status: 'active', deletedAt: null } }),
    db.user.findUnique({ where: { id: userId }, select: { status: true } }),
  ]);

  // Build streak section
  const daysSinceLast = streak?.lastCompletedDate
    ? differenceInCalendarDays(today, streak.lastCompletedDate)
    : null;

  const streakData = {
    current: streak && streak.currentStreak > 0 ? streak.currentStreak : '—',
    longest: streak?.longestStreak ?? 0,
    daysSinceLast,
    atRisk: daysSinceLast !== null && daysSinceLast >= 1 && daysSinceLast <= 2,
  };

  // Build week summary
  const completionRate = goals.length > 0
    ? Math.round((weekCheckins.length / (goals.length * 7)) * 100)
    : 0;

  const moods = weekCheckins.filter(c => c.mood !== null).map(c => c.mood!);
  const efforts = weekCheckins.filter(c => c.effortLevel !== null).map(c => c.effortLevel!);

  // Best goal
  const goalCounts: Record<string, { title: string; count: number }> = {};
  for (const c of weekCheckins) {
    if (!goalCounts[c.goalId]) goalCounts[c.goalId] = { title: c.goal.title, count: 0 };
    goalCounts[c.goalId].count++;
  }
  const bestGoal = Object.entries(goalCounts).sort((a, b) => b[1].count - a[1].count)[0]?.[1] ?? null;

  const weekSummary = {
    totalCheckins: weekCheckins.length,
    completionRate,
    averageMood: moods.length > 0 ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null,
    averageEffort: efforts.length > 0 ? Math.round((efforts.reduce((a, b) => a + b, 0) / efforts.length) * 10) / 10 : null,
    bestGoal,
  };

  // Mood trend (last 7 days, one per day)
  const moodTrend = moodData.map(c => ({ date: format(c.date, 'yyyy-MM-dd'), mood: c.mood! }));

  // Next action derived from user state
  const nextAction = deriveNextAction(user?.status ?? 'active', streakData);

  return res.json({
    success: true,
    data: { streak: streakData, weekSummary, moodTrend, nextAction, userState: user?.status ?? 'onboarding' },
  });
}
```

### 5.4 Weekly / Monthly Summary

```ts
// GET /api/dashboard/weekly-summary
// GET /api/dashboard/monthly-summary

async function getPeriodSummary(req, res) {
  const userId = req.user.id;
  const days = req.path.includes('monthly') ? 30 : 7;
  const since = addDays(startOfDay(new Date()), -days);

  const checkins = await db.checkin.findMany({
    where: { userId, date: { gte: since } },
    include: { goal: { select: { title: true } } },
    orderBy: { date: 'asc' },
  });

  const totalDays = days;
  const uniqueDays = new Set(checkins.map(c => format(c.date, 'yyyy-MM-dd'))).size;
  const streakData = await db.streak.findUnique({ where: { userId } });

  const moods = checkins.filter(c => c.mood !== null).map(c => c.mood!);
  const efforts = checkins.filter(c => c.effortLevel !== null).map(c => c.effortLevel!);

  return res.json({
    success: true,
    data: {
      period: `${days}-day`,
      totalCheckins: checkins.length,
      uniqueCheckinDays: uniqueDays,
      completionRate: Math.round((uniqueDays / totalDays) * 100),
      averageMood: moods.length > 0 ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null,
      averageEffort: efforts.length > 0 ? Math.round((efforts.reduce((a, b) => a + b, 0) / efforts.length) * 10) / 10 : null,
      taskCompletionRate: checkins.length > 0
        ? Math.round((checkins.filter(c => c.taskCompleted).length / checkins.length) * 100)
        : 0,
      goalsTracked: new Set(checkins.map(c => c.goalId)).size,
      currentStreak: streakData?.currentStreak ?? 0,
      longestStreak: streakData?.longestStreak ?? 0,
    },
  });
}
```

### 5.5 Next Action Derivation

```ts
// lib/progress/nextAction.ts

export function deriveNextAction(state: UserStatus, streak: { current: number | '—'; daysSinceLast: number | null; atRisk: boolean }): string {
  switch (state) {
    case 'onboarding':
      return 'Complete your onboarding to get started.';
    case 'active':
      if (streak.current === '—') return "Ready for today's small win?";
      if (streak.atRisk) return "Almost there — one more day keeps your streak alive.";
      return streak.current === 1
        ? "Great start! Let's make it two."
        : `Day ${streak.current} — keep the momentum going.`;
    case 'streak-broken':
      return `Let's build momentum again. Start a new streak today.`;
    case 'recovering':
      return `Day ${streak.current} — you're building back. Keep showing up.`;
    case 'milestone-reached':
      return `You hit a milestone! Let's keep going.`;
    case 'inactive':
      return "It's been a while. Every day is a chance to restart.";
    case 'churn-risk':
      return "We miss you. One check-in is all it takes to come back.";
    default:
      return "Ready for today?";
  }
}
```

---

## 6. Mood Charting

```ts
// lib/progress/moodAggregation.ts

interface MoodStats {
  average: number | null;
  trend: 'up' | 'down' | 'stable' | null;  // last 3 days vs previous 3
  distribution: { level: number; count: number; percentage: number }[];
}

export function aggregateMood(checkins: { mood: number | null; date: Date }[]): MoodStats {
  const withMood = checkins.filter(c => c.mood !== null && c.mood !== undefined) as { mood: number; date: Date }[];
  if (withMood.length === 0) return { average: null, trend: null, distribution: [] };

  const average = Math.round((withMood.reduce((a, b) => a + b.mood, 0) / withMood.length) * 10) / 10;

  // Trend: compare last 3 to previous 3
  const sorted = [...withMood].sort((a, b) => a.date.getTime() - b.date.getTime());
  const last3 = sorted.slice(-3);
  const prev3 = sorted.slice(-6, -3);
  const last3Avg = last3.reduce((a, b) => a + b.mood, 0) / last3.length;
  const prev3Avg = prev3.length > 0 ? prev3.reduce((a, b) => a + b.mood, 0) / prev3.length : last3Avg;

  const trend = prev3Avg > 0
    ? last3Avg > prev3Avg + 0.3 ? 'up'
      : last3Avg < prev3Avg - 0.3 ? 'down'
      : 'stable'
    : null;

  // Distribution
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of withMood) counts[c.mood]++;
  const distribution = Object.entries(counts).map(([level, count]) => ({
    level: Number(level),
    count,
    percentage: Math.round((count / withMood.length) * 100),
  }));

  return { average, trend, distribution };
}
```

---

## 7. Background Jobs (Cron)

### 7.1 Streak Break & Churn Risk Detection

```ts
// jobs/checkUserStates.ts  (cron: daily at 00:00 UTC)

const MISSED_THRESHOLD = 2;
const INACTIVE_THRESHOLD = 14;
const CHURN_RISK_THRESHOLD = 19;

export async function checkUserStates() {
  const users = await db.user.findMany({
    where: { status: { in: ['active', 'inactive'] }, deletedAt: null },
    select: { id: true, status: true },
  });

  for (const user of users) {
    const streak = await db.streak.findUnique({ where: { userId: user.id } });
    if (!streak || !streak.lastCompletedDate) continue;

    const daysSince = differenceInCalendarDays(new Date(), streak.lastCompletedDate);

    if (user.status === 'active' && daysSince > MISSED_THRESHOLD) {
      // Streak is broken — reset streak, update state
      await db.streak.update({
        where: { userId: user.id },
        data: { currentStreak: 0, recoveryStreak: 0 },
      });
      await db.user.update({ where: { id: user.id }, data: { status: 'streak-broken' } });
      await analytics.track('streak_broken', { userId: user.id, previousStreak: streak.currentStreak, longestStreak: streak.longestStreak });
    }

    if (daysSince >= INACTIVE_THRESHOLD && user.status === 'active') {
      await db.user.update({ where: { id: user.id }, data: { status: 'inactive' } });
    }

    if (daysSince >= CHURN_RISK_THRESHOLD && user.status === 'inactive') {
      await db.user.update({ where: { id: user.id }, data: { status: 'churn_risk' } });
      await analytics.track('churn_risk_detected', { userId: user.id, daysSinceLastCheckin: daysSince });
    }
  }
}
```

### 7.2 Notification Scheduling

Per AGENTS.md §6:
- Max 2 reminders per day
- Adaptive: ignored reminders reduce frequency over time
- Inactivity triggers encouragement copy, not guilt
- Milestone triggers celebration (push notification)

```ts
// jobs/scheduleReminders.ts  (cron: hourly)

export async function scheduleReminders() {
  const now = new Date();
  const today = startOfDay(now);

  const users = await db.user.findMany({
    where: {
      deletedAt: null,
      reminderTime: { not: null },
      status: { notIn: ['onboarding', 'churn-risk'] },
    },
    include: {
      streak: true,
      notificationLogs: { where: { sentAt: { gte: today } } },
    },
  });

  for (const user of users) {
    // Max 2 reminders/day
    if (user.notificationLogs.length >= 2) continue;

    // Adaptive: reduce frequency if ignored
    if (user.notificationIgnoredCount >= 3) continue; // skip until next cycle

    // Check if already checked in today
    const alreadyCheckedIn = await db.checkin.findFirst({
      where: { userId: user.id, date: today },
    });
    if (alreadyCheckedIn) continue;

    // Send reminder (via FCM — see notification skill)
    const message = deriveReminderMessage(user.status, user.streak);
    await sendPushNotification(user.id, message);
  }
}

function deriveReminderMessage(status: string, streak: Streak | null): string {
  const count = streak?.currentStreak ?? 0;
  if (status === 'streak-broken' || count === 0) {
    return "Your momentum is still there — start fresh today.";
  }
  if (status === 'inactive') {
    return "It's never too late to start again. One small step is all it takes.";
  }
  if (status === 'milestone-reached') {
    return "You just hit a milestone! Let's keep the celebration going.";
  }
  return "Ready for today's small win?";
}
```

---

## 8. Analytics Events

Per AGENTS.md §8, the progress tracker triggers:

| Event | Trigger | Data |
|---|---|---|
| `daily_checkin_completed` | `POST /api/checkins` | `{ userId, goalId, taskCompleted, mood, effortLevel }` |
| `streak_started` | First check-in after `currentStreak` was 0 | `{ userId, streakCount: 1 }` |
| `streak_broken` | Cron: 2+ consecutive misses | `{ userId, previousStreak, longestStreak }` |
| `milestone_reached` | Streak hits 3, 7, 14, 21, 30, 60, 100, 365 | `{ userId, streakCount, milestoneType }` |
| `churn_risk_detected` | Cron: 19+ days no check-in | `{ userId, daysSinceLastCheckin }` |

---

## 9. UI Component Specs

Cross-reference to `design-system.md` and `component-builder` skill for full component APIs:

| Component | States | Key Behaviour |
|---|---|---|
| **StreakBadge** | `active` (orange), `at-risk` (yellow), `broken` (muted), `never-started` ("—") | Pulse animation only for active. Tap opens streak history. |
| **MoodSelector** | 5 emoji scale (1=😢, 2=😕, 3=😐, 4=🙂, 5=😄) | Spring animation on select, haptic feedback (RN). Once set, can only be changed (no deselection). |
| **MilestoneOverlay** | Full-screen celebration with confetti | Auto-dismisses after 4s. Shows `"{count} days strong!"` |
| **DashboardCard** | `loading` (skeleton), `loaded`, `empty` | Uses `bgSurface` background, rounded corners `radius.md` |
| **ProgressBar** | 0% = "Just getting started" text, 1-99% = filled to percentage, 100% = completed with checkmark | Never show 0% bar — show label instead. |

---

## 10. Performance & Caching

- `GET /api/streaks/:userId`: cache in Redis TTL 1 hour, invalidate on check-in
- `GET /api/dashboard`: cache in Redis TTL 5 minutes, invalidate on check-in
- `GET /api/checkins`: page-based, no caching (fresh data required)
- Redis key pattern: `streak:{userId}`, `dashboard:{userId}`
- All streak calculations use `date-fns` for timezone-safe date math
- Use `@db.Date` in Prisma — never store time components on `date`/`lastCompletedDate`

---

## 11. Testing Checklist

- [ ] First check-in creates streak at 1
- [ ] Consecutive check-in increments streak
- [ ] 1 missed day = at-risk (yellow), streak preserved
- [ ] 2+ missed days = streak broken, `currentStreak` resets to 0
- [ ] `longestStreak` never decreases
- [ ] Recovery streak increments on each check-in after break
- [ ] State transitions: `streak-broken → recovering → active` after 3 consecutive check-ins
- [ ] Milestone triggered exactly at 3, 7, 14, 21, 30, 60, 100, 365
- [ ] Milestone NOT triggered for non-milestone counts (e.g. 4, 8, 15)
- [ ] Same-day duplicate check-in for same goal returns 409
- [ ] Dashboard returns correct weekly completion rate (0-100%)
- [ ] Mood aggregation trend correctly identifies up/down/stable
- [ ] Redis cache invalidated after check-in
- [ ] Redis cache hit returns fresh data
- [ ] `displayValue` is `"—"` when `currentStreak` is 0 (never-started)
- [ ] `deriveNextAction()` returns correct message for all 7 user states
- [ ] Cron job correctly detects 14-day inactivity → `inactive` status
- [ ] Cron job correctly detects 19-day inactivity → `churn-risk` status
- [ ] Notification scheduling sends max 2/day
- [ ] Notification scheduling skips users with 3+ ignored notifications

---

## Cross-References

| File / Resource | Why |
|---|---|
| `db-migration-runner` skill | Canonical `Streak`, `Checkin`, `Goal`, `User` schemas |
| `design-system.md` | StreakBadge (yellow at-risk, never red), MoodSelector (5-point emoji, spring animation), MilestoneOverlay (confetti, auto-dismiss 4s), progress bar (never 0%), empty states, state anatomy |
| `architecture.md` | Route inventory (`GET /api/streaks/:userId`, `GET /api/dashboard`), Redis caching pattern, error response shape |
| `code-style.md` | Error handling, Zod validation, logger conventions, testing patterns |
| `security.md` | Checkin notes encryption (AES-256-GCM), rate limiting, PII rules |
| `AGENTS.md` | Streak recovery rules (§11), user states (§5), notification rules (§6), analytics events (§8), monetisation tiers (§12) |
| `ai-plan-generator` skill | Coach messages triggered by milestones and streak breaks |
| `component-builder` skill | Full component specs: StreakBadge, MoodSelector, MilestoneOverlay, DashboardCard, ProgressBar |
| `screen-builder` skill | Dashboard screen template, check-in screen template, streak history screen |
| `auth-system-builder` skill | User state management (status field), onboarding completion triggers `active` state |
