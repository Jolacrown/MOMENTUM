---
#name: component-builder
#description: Builds reusable, production-grade UI components for Momentum. Use this skill when creating or modifying any shared UI element — buttons, cards, inputs, streak badges, mood selectors, check-in forms, coach message bubbles, notification banners, goal cards, or any component that lives in /src/components. Always load design-system.md and code-style.md alongside this skill.
---

## What This Skill Does

Generates the shared component library for Momentum — dark-mode-first, mobile-optimised, emotionally resonant. Every component must feel like it belongs to the same design language: warm, energetic, human. Not a generic UI kit.

## When to Load

- Creating any new component in `/src/components/`
- Modifying existing shared components
- Building component variants (e.g. StreakBadge in active vs. at-risk state)
- Designing empty states, loading skeletons, or error states for any UI surface
- Any task where the design-system tokens need to be applied in code

---

## Component Inventory (Full MVP Set)

These are all the components needed for Momentum MVP. Build from this list — do not invent new shared components without good reason.

### Primitives
```
Button            — primary, secondary, ghost, danger; with loading state
TextInput         — with label, error, helper text; controlled
TextAreaInput     — for notes field; auto-expands to max 4 lines
SelectInput       — for skill level, learning style dropdowns
TimePicker        — for reminder time setting
ProgressBar       — animated fill, percentage label optional
Divider           — horizontal rule, subtle
Badge             — small pill label (e.g. "Premium", "Active", "Paused")
Avatar            — initials fallback, 32px / 48px sizes
Spinner           — loading indicator, inherits text colour
```

### Feedback & State
```
Toast             — success / error / info; auto-dismiss 3s; bottom of screen
EmptyState        — illustration + headline + CTA button
ErrorBoundary     — catches render errors, shows fallback card
SkeletonCard      — shimmer placeholder matching card dimensions
ConfirmModal      — destructive action confirmation (e.g. delete goal)
```

### Momentum-Specific
```
StreakBadge        — the hero element; active, at-risk, broken states
MoodSelector       — 5-point emoji scale; haptic feedback on select
CheckinCard        — today's task + mood + notes + effort in one surface
GoalCard           — title, status badge, progress bar, pause/resume actions
CoachMessageBubble — AI response card; distinct from user messages
RecommendationCard — type badge, title, CTA; teal accent
MilestoneOverlay   — full-screen celebration; confetti, streak number, dismiss
WeekGrid           — 7-dot completion grid (Mon–Sun); colour-coded
NotificationBanner — in-app reminder; max 1 visible at a time
PremiumGate        — blur overlay + upgrade CTA for locked features
```

---

## Component Structure

Every component file follows this structure:

```
/src/components/[component-name]/
  index.tsx          ← main component
  [name].types.ts    ← Props interface + variant types
  [name].test.tsx    ← component tests
```

For simple primitives, a single file is acceptable. For complex components (StreakBadge, CheckinCard, MilestoneOverlay), use the full structure.

---

## Component Implementation Standards

### Props Design

- All props must be explicitly typed — no implicit `any`
- Required props first, optional last
- Use `children` prop for compositional components
- Provide sensible defaults for all optional props
- Boolean props: use positive naming (`isLoading`, `isDisabled`, `isPremium`)

```ts
// ✅ Good
interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  state: 'active' | 'at-risk' | 'broken';
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

// ❌ Bad
interface Props {
  data: any;
  type?: string;
}
```

### Styling Rules

Always use design-system tokens — never hardcode colours, spacing, or font sizes.

```tsx
// Tailwind with design token class names
// Use only classes mapped to design-system variables
<div className="bg-bg-surface rounded-lg p-5 border border-white/[0.06]">
```

---

## Component-by-Component Specifications

### StreakBadge

The most important component in the product. Treat it accordingly.

```tsx
interface StreakBadgeProps {
  currentStreak: number;
  state: 'active' | 'at-risk' | 'broken';
  size?: 'sm' | 'md' | 'lg'; // 60px / 88px / 112px
  showPulse?: boolean;         // true when active + just completed
}
```

States:
- `active` → orange border (#F97316), orange number, subtle pulse animation
- `at-risk` → yellow border (#EAB308), yellow number, no pulse — never red
- `broken` → muted border (#5A5A55), muted number, no animation

Never show "0" — show "—" when streak is 0 and user has never checked in.

```tsx
// Pulse animation (active state only)
// CSS: @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4) } 50% { box-shadow: 0 0 0 12px rgba(249,115,22,0) } }
// RN: Animated.loop with Animated.sequence scaling 1.0 → 1.04 → 1.0
```

---

### MoodSelector

```tsx
interface MoodSelectorProps {
  value: number | null;         // 1–5
  onChange: (mood: number) => void;
  disabled?: boolean;
}

const MOODS = [
  { value: 1, emoji: '😔', label: 'Rough' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😊', label: 'Great' },
  { value: 5, emoji: '🔥', label: 'On fire' },
];
```

Interaction:
- Tap to select — scale to 1.3 with spring animation
- Selected: ring in primary-500, label appears below emoji
- Haptic feedback on selection (light impact)
- Never allow deselection — once a mood is set, it can only be changed

---

### CheckinCard

The daily check-in surface. Houses three inputs in a single card flow:

```tsx
interface CheckinCardProps {
  goalTitle: string;
  date: string;
  onSubmit: (data: CheckinFormData) => Promise<void>;
  isSubmitting?: boolean;
  existingCheckin?: CheckinFormData; // for viewing completed check-ins
}

interface CheckinFormData {
  taskCompleted: boolean;
  mood: number;           // 1–5
  notes: string;          // optional, max 500 chars
  effortLevel: 1 | 2 | 3; // 1=low, 2=medium, 3=high
}
```

Layout:
1. Task completion toggle (large, thumb-friendly)
2. MoodSelector component
3. Effort level (3-button group: Light / Focused / All-in)
4. Notes textarea (optional, placeholder: "Anything worth noting?")
5. Submit button — primary, full width

Prevent duplicate submission: disable after first successful submit for that date.

---

### GoalCard

```tsx
interface GoalCardProps {
  goal: Goal;
  onPause: (goalId: string) => void;
  onResume: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  isPremium?: boolean;       // shows lock icon if free tier + >1 goal
}
```

States: `active` (orange accent) | `paused` (muted, yellow badge) | `completed` (green badge, no actions)

Show progress bar only when `progress_percent > 0`. Never show 0% bar — show "Just getting started" text instead.

---

### CoachMessageBubble

```tsx
interface CoachMessageBubbleProps {
  message: string;
  timestamp: string;
  isLoading?: boolean; // shows typing indicator
}
```

- Background: `bg-surface`, left-aligned
- Orange left border (3px) to signal AI origin
- Show typing animation (3 dots) while `isLoading` is true
- Never show "AI says:" or "Coach:" prefix — the design communicates the source
- Text renders with `text-base`, `text-text-primary`, line-height 1.6

---

### MilestoneOverlay

Triggered at streaks: 3, 7, 14, 21, 30, 60, 100, 365.

```tsx
interface MilestoneOverlayProps {
  streak: number;
  goalTitle: string;
  onDismiss: () => void;
}
```

- Full-screen dark overlay (`bg-bg-base/95`)
- Centre: streak number in `text-4xl`, `font-display`, orange
- Subtitle: milestone-specific copy (see copy map below)
- Confetti burst on mount (use `canvas-confetti`)
- Auto-dismiss after 4 seconds OR on tap — whichever comes first
- `accent-purple` (#A78BFA) as secondary colour for this celebration context

Copy map:
```ts
const MILESTONE_COPY: Record<number, string> = {
  3:   "Three days straight. The habit is forming.",
  7:   "One full week. You're doing the thing.",
  14:  "Two weeks. This is starting to stick.",
  21:  "21 days. Science says habits live here.",
  30:  "A whole month. You showed up every day.",
  60:  "60 days. Most people quit before this.",
  100: "100 days. You are genuinely different now.",
  365: "A full year. You became who you were building.",
};
```

---

### PremiumGate

Wraps any premium-only feature. Shows blur + upgrade prompt for free users.

```tsx
interface PremiumGateProps {
  children: React.ReactNode;
  isUnlocked: boolean;        // true = render children, false = show gate
  featureName: string;        // e.g. "Unlimited Goals"
  onUpgrade: () => void;
}
```

Locked state: blur `children` at 40% opacity, overlay card with lock icon, feature name, and "Unlock Premium" button.
Never remove the content entirely — showing a blurred preview performs better than an empty state.

---

### EmptyState

```tsx
interface EmptyStateProps {
  illustration: 'no-goals' | 'no-checkins' | 'no-streaks' | 'no-recommendations';
  headline: string;
  ctaLabel?: string;
  onCta?: () => void;
}
```

Each illustration variant is a warm-palette SVG. Headlines for each context:
```
no-goals:           "Nothing to work toward yet — let's fix that."
no-checkins:        "No check-ins yet. Today's a good day to start."
no-streaks:         "Your streak starts the moment you do."
no-recommendations: "We're finding the right resources for you."
```

---

## Accessibility Checklist (per component)

Before considering any component done:
- [ ] Minimum 44×44px touch target on all interactive elements
- [ ] `accessibilityLabel` on all icon-only buttons
- [ ] `accessibilityRole` set correctly (`button`, `text`, `image`, etc.)
- [ ] Colour is never the sole indicator of state — add icon or label
- [ ] Works with screen readers (VoiceOver / TalkBack)
- [ ] No animation if `prefers-reduced-motion` is set

---

## Testing Each Component

Every component must have tests for:
1. Default render (no crash)
2. All state variants (active/at-risk/broken, loading/idle/error)
3. User interaction (tap, input change, submit)
4. Disabled / locked states
5. Empty/null data edge cases

```tsx
// Example: StreakBadge test
describe('StreakBadge', () => {
  it('renders active state correctly', () => { ... });
  it('renders at-risk state with warning colour', () => { ... });
  it('shows em-dash when streak is 0 and no prior history', () => { ... });
  it('does not show pulse animation in at-risk state', () => { ... });
});
```