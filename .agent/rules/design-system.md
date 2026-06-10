---
trigger: always_on
---

# Momentum Design System Rules

**Version:** 1.0
**Token file:** `/src/styles/tokens.ts` (source of truth for all design values)

---

## Purpose

This document defines the design system for Momentum — Africa's first emotionally intelligent AI accountability platform. It ensures consistency, accessibility, scalability, and emotional alignment across all user experiences.

Never hardcode design values that already exist in the token file.

---

## Design Philosophy

> Progress over perfection.

The interface should feel: calm, encouraging, supportive, focused, trustworthy.

Avoid: stressful, overwhelming, noisy, competitive, guilt-driven.

Every screen should help users feel capable of taking the next small step.

---

## Core Design Principles

### 1. Clarity First
Users should understand where they are, what they need to do, and what happens next — within a few seconds.

### 2. One Primary Action
Every screen must have one clear primary action. Avoid competing CTAs.

| Screen | Primary Action |
|---|---|
| Dashboard | Complete Today's Check-In |
| Goal Screen | Update Progress |
| Recommendations | View Recommendation |

### 3. Progress Visibility
Users should always understand current progress, streak status, milestone status, and next action — without excessive navigation.

### 4. Encourage, Never Shame
Never use guilt messaging, punishment language, or failure-focused UI.

| Avoid | Use Instead |
|---|---|
| "You failed" | "Ready to continue?" |
| "You broke your streak" | "Let's build momentum again." |
| "You are falling behind" | "Ready for today's small win?" |

---

## Design Tokens

All code must import from `@/styles/tokens` — never hardcode values.

### Color Palette

```ts
// ── Brand ──────────────────────────────────
primary50:   '#FFF7ED'
primary100:  '#FFEDD5'
primary200:  '#FED7AA'
primary300:  '#FDBA74'
primary400:  '#FB923C'
primary500:  '#F97316'   // Main brand orange
primary600:  '#EA580C'
primary700:  '#C2410C'
primary800:  '#9A3412'
primary900:  '#7C2D12'

// ── Neutrals ───────────────────────────────
bgBase:      '#0C0C0A'   // App background (dark)
bgSurface:   '#1C1C1A'   // Card / surface background
bgElevated:  '#2C2C2A'   // Modal / elevated surface
borderBase:  '#3C3C3A'
borderLight: '#5A5A55'

textPrimary: '#FAFAF9'
textSecondary:'#A8A8A3'
textMuted:   '#6C6C68'

// ── Semantic ───────────────────────────────
success500:  '#22C55E'   // Milestones, completed
warning500:  '#EAB308'   // At-risk / attention (never for missed streaks)
error500:    '#EF4444'   // System errors only (never for personal setbacks)
info500:     '#3B82F6'   // Coach messages, informational

// ── Accent (rare use) ──────────────────────
accentPurple:'#A78BFA'   // Celebration contexts (MilestoneOverlay)
```

### Typography Scale

```ts
fontDisplay: 'Inter',          // headings (system font fallback on RN)
fontBody:    'Inter',          // body text

textxs:    12                  // captions, badges
textsm:    14                  // secondary text
textbase:  16                  // body copy
textlg:    18                  // large body
textxl:    20                  // section headings
text2xl:   24                  // screen titles
text3xl:   30                  // hero numbers (streak count)
text4xl:   36                  // milestone overlays

lineHeight: {
  tight:  1.2,                 // headings
  normal: 1.5,                 // body
  relaxed:1.8,                 // long-form reading
}
```

### Spacing Scale (4px grid)

```ts
spacing: {
  4:   4,   8:   8,   12:  12,   16:  16,
  20:  20,  24:  24,  32:  32,   40:  40,
  48:  48,  56:  56,  64:  64,   80:  80,
}
```

### Border Radius

```ts
radius: {
  sm:   4,                     // inputs, small badges
  md:   8,                     // cards, buttons
  lg:   12,                    // modals, large surfaces
  xl:   16,                    // sheets
  full: 9999,                  // pills, avatars
}
```

### Shadows

```ts
shadows: {
  sm:   '0px 1px 2px rgba(0,0,0,0.3)',
  md:   '0px 4px 6px rgba(0,0,0,0.4)',
  lg:   '0px 10px 15px rgba(0,0,0,0.5)',
}
// React Native: use elevation values (sm=2, md=4, lg=8)
// with shadowColor: '#000' and matching opacity
```

### Motion

```ts
duration: {
  fast:   150,                  // micro-interactions
  normal: 300,                  // standard transitions
  slow:   500,                  // screen transitions
}
easing: {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring:  { damping: 15, stiffness: 200 },  // RN Animated.spring
}
```

---

## Platform-Specific Rules

| Concern | React Native | Web (Next.js) |
|---|---|---|
| Font family | System font (SF Pro / Roboto) + Inter via custom font | Inter via `next/font` |
| Navigation | React Navigation stack | Next.js App Router |
| Safe areas | `useSafeAreaInsets` from `react-native-safe-area-context` | `env(safe-area-inset-*)` CSS |
| Shadows | `elevation` prop + `shadowColor` | `box-shadow` from tokens |
| Animations | `Animated` / `Reanimated` | CSS transitions / Framer Motion |
| Touch targets | 44×44px minimum (OS requirement) | 44×44px minimum (WCAG guideline) |
| Gestures | Swipe-to-dismiss, pull-to-refresh | Click, hover (no gesture dependency) |
| Haptic feedback | Use `expo-haptics` or `react-native-haptic-feedback` | N/A |

---

## Theme Strategy (Dark Mode)

Momentum is **dark-mode-first by default**. The dark palette above is the primary theme.

```ts
export const theme = {
  dark: { ...tokens },          // Always-active default
  light: null,                  // Post-MVP — not building light mode for launch
}
```

- No light mode for MVP. Ship dark-only to reduce QA surface.
- When light mode is added post-MVP, it inverts `bgBase` ↔ `textPrimary` and shifts the neutral ramp up.

---

## Layout Rules

- **Mobile first.** Design for the smallest screen first (320px width min). Scale up to tablet (768px) and desktop (1024px+).
- **Breakpoints:** `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` (Tailwind-compatible)
- Content width: max 600px on mobile, max 1200px on desktop.
- Screen hierarchy: Screen Title → Supporting Context → Primary Content → Primary Action → Secondary Actions.

---

## Component State Anatomy

Every interactive component must handle these states (see `component-builder` skill for full specs):

| State | Behaviour |
|---|---|
| **default** | Resting appearance, no interaction |
| **active / focused** | Highlighted border or glow (primary-500 ring) |
| **disabled** | 40% opacity, no pointer events |
| **loading** | Pulsing skeleton (cards) or spinner (buttons) — never a blank static state |
| **error** | Red border (error-500), error message below |
| **empty** | Illustration + headline + CTA (see EmptyState in component-builder) |
| **success (transient)** | Green flash or checkmark animation, 2s then revert |

### Key Component Specs (full details in `component-builder` skill)

| Component | States | Notes |
|---|---|---|
| **StreakBadge** | `active`, `at-risk`, `broken` | Never red for at-risk; use yellow. Never show "0" — show "—" |
| **MoodSelector** | 5 emoji scale, spring animation on select, haptic feedback | Once set, can only be changed (no deselection) |
| **GoalCard** | `active`, `paused`, `completed` | No 0% progress bar — show "Just getting started" instead |
| **MilestoneOverlay** | Full-screen celebration, auto-dismiss 4s | Milestones: 3, 7, 14, 21, 30, 60, 100, 365 days |
| **PremiumGate** | Blurred preview for free users, never hide content entirely | Lock icon + feature name + "Unlock Premium" CTA |

---

## Iconography

- Use **Lucide Icons** (web) / `lucide-react-native` (mobile) — consistent, open-source, well-maintained
- Size: 16px (inline), 20px (buttons), 24px (standalone), 32px (large indicators)
- Colour: inherit from text colour by default; primary-500 for active states
- All icon-only buttons must have `accessibilityLabel`
- No custom SVG icons for MVP — ship with Lucide defaults

---

## Form & Input Design

### Multi-Step Forms (Onboarding)
- Show step indicator at top: filled dot (completed) → hollow dot (current) → grey dot (upcoming)
- "Back" button only appears after step 1
- "Skip" appears on optional steps (notes, learning style)
- Validate on "Continue" tap — show inline errors, never blocking the whole form
- Preserve form state if user navigates back

### Single-Form Validation
- Validate on blur for individual fields, on submit for the entire form
- Error message appears below the field in error-500 at `text-sm`
- Never disable the submit button until submission is in flight — show errors instead

### Text Input Rules
- Clear label above the field (never rely solely on placeholders)
- Helper text below in textMuted when field is empty and unfocused
- Character count shown for fields with limits (notes: max 500)
- Autofocus the first field on screen mount

---

## Offline & Connectivity UI

Momentum targets the Nigerian market where connectivity is intermittent. Handle every state:

| Scenario | UI Behaviour |
|---|---|
| **Loading** | Skeleton card matching real dimensions. Never a blank screen. |
| **Offline (no connection)** | Persistent non-dismissible banner at top: "You're offline. Progress saves when you reconnect." Show last cached data. |
| **Slow connection** | Silently show cached data + background refresh. No blocking spinners. |
| **Reconnection** | Banner changes to "Connected" for 3s then dismisses. Auto-sync queued check-ins. |
| **Failed mutation (no retry)** | Toast at bottom: "Couldn't save. Tap to retry." with retry action. |
| **Offline check-in** | Queue the check-in locally with `isPending: true` flag. Sync when online. |

---

## Onboarding Design

The onboarding flow is the user's first impression. Must be completable in under 3 minutes.

### Steps (in order)
1. **Name** — single TextInput, auto-focused
2. **Goal** — TextInput "What do you want to achieve?"
3. **Skill Level** — 3-button group: Beginner / Intermediate / Advanced
4. **Learning Style** — 3-button group: Visual / Reading / Hands-on
5. **Daily Time** — quick-select chips: 5min, 10min, 15min, 30min, Custom
6. **Reminder Time** — TimePicker with preselected 8:00 AM
7. **Consent** — GDPR-style checkbox, plain language, link to privacy policy

### Visual Rules
- Full-screen, no tab bar or back button to home
- Warm illustration on each step (SVG, in `primary200` tones)
- Progress dots at top (max 7 dots visible, scrollable)
- "Continue" button: primary, full-width, with arrow icon
- "Almost done!" at step 6 to reduce drop-off
- Completion: show MilestoneOverlay for 3-day streak welcome prompt

---

## Premium / Upgrade UI

### Upgrade Entry Points
1. **Dashboard** — subtle "Go Premium" card below streak, dismissible
2. **Goal limit** — PremiumGate wraps the "Add Goal" button when at free-tier limit (1 goal)
3. **AI Coach** — PremiumGate on coach after 5 free messages per day
4. **Settings** — "Upgrade to Premium" row with price

### Upgrade Screen Layout
- Hero section: feature comparison (Free vs Premium) in a two-column card layout
- Price: display in NGN (₦) — Flutterwave processes in NGN
- CTA: "Start Premium — ₦X,XXX/month" with Flutterwave payment modal trigger
- Footer: "Cancel anytime" link, "Restore Purchases" (mobile)
- Never use countdown timers or scarcity tactics

### Post-Upgrade
- Confetti animation (same as MilestoneOverlay)
- Toast: "Welcome to Premium! 🎉" — auto-dismiss 4s
- Unlock gated features immediately without requiring re-login

---

## Pagination & Infinite Scroll

- **Recommendations**: infinite scroll, trigger load at 200px from bottom
- **Check-in history**: page-based with "Load More" button (safer UX)
- **Coach chat**: scroll to top loads older messages (inverted list)
- Loading indicator: spinner at bottom of list, never a skeleton for the full list
- Empty end state: "You've seen everything" in textMuted, centred
- Error during load: inline retry button at bottom of list; do not clear existing items

---

## Empty States

Every empty state must provide context, encouragement, and a next action.

| Context | Headline | CTA |
|---|---|---|
| No goals | "Nothing to work toward yet — let's fix that." | Create Your First Goal |
| No check-ins | "No check-ins yet. Today's a good day to start." | Start Check-In |
| No streaks | "Your streak starts the moment you do." | Complete Today |
| No recommendations | "We're finding the right resources for you." | (none — auto-refresh) |

---

## Loading States

- Use skeleton cards matching the exact dimensions of the content being loaded
- Buttons: show spinner + "Saving..." text inside the button (never disable without feedback)
- Full-screen load (rare): centred spinner + text like "Loading your progress..."
- Skeleton animation: shimmer effect (gradient sweep), duration 1.5s, endless loop

---

## Error States

Errors should explain the issue, provide a recovery action, and avoid technical jargon.

| Scenario | Message | Action |
|---|---|---|
| Network failure | "We couldn't load your progress. Check your connection." | Retry button |
| Save failure | "Couldn't save your check-in. It's been queued." | Dismiss |
| Auth failure | "Session expired. Please sign in again." | Sign In button |
| Server error | "Something went wrong on our end. We're on it." | Retry button |

---

## Streak Design Rules

- Celebrate progress, support recovery, avoid loss-focused language
- Active streak: orange (`primary500`), pulse animation
- At-risk (2+ missed days): yellow (`warning500`), no pulse — never red
- Broken: muted (`borderLight`), no animation
- Missed streak copy: "Momentum pauses. It doesn't disappear."
- Never show "0" for never-started streak — show "—" instead

---

## Notification Design (In-App)

- Max 1 visible notification banner at a time
- Slide down from top, dismiss on tap or auto-dismiss after 5s
- Copy: encouraging, concise, never urgent
- Good: "Ready for today's small win?"
- Bad: "You are falling behind."

---

## Motion Guidelines

- Duration: 150ms (micro-interactions), 300ms (standard), 500ms (screen transitions)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` for all CSS transitions
- Spring (RN): damping 15, stiffness 200 for tap feedback
- Respect `prefers-reduced-motion`: disable all animations, show instant transitions
- Never use motion for branding or decoration — every animation must serve a purpose

---

## Analytics Instrumentation

All UI events must be tracked with consistent naming.

```ts
// Naming convention: [object]_[action]
// Examples:
onboarding_step_viewed
goal_created
checkin_completed
streak_milestone_reached
upgrade_modal_opened
upgrade_completed
notification_banner_dismissed
```

- Send analytics events from the hook/service layer, never from component JSX
- Events must include `userId`, `timestamp`, and relevant context (e.g. `streakCount`, `goalId`)
- Do not PII in event names or properties (no names, emails, notes)
- See AGENTS.md section 8 for the full event list

---

## Design Review Checklist

Before shipping any feature:

- [ ] Uses token system values — no hardcoded colours, spacing, or fonts
- [ ] Passes accessibility standards (44px touch targets, screen reader labels, contrast)
- [ ] Has one clear primary action per screen
- [ ] Includes loading state (skeleton or spinner)
- [ ] Includes empty state (illustration + CTA where applicable)
- [ ] Includes error state (user-friendly message + recovery action)
- [ ] Includes offline state (banner + cached data fallback)
- [ ] Supports mobile layouts (tested at 320px width)
- [ ] Supports dark theme (all colours from token palette)
- [ ] Reinforces Momentum's supportive tone (no guilt-based UX)
- [ ] Maintains visual consistency with existing screens
- [ ] Tracks all relevant analytics events

If any item fails, the feature is not ready for release.

---

## Golden Rule

Every design decision should answer:
> "Does this help the user take the next small step forward?"

If not, reconsider the design.

---

## Cross-References

| File | Why |
|---|---|
| `architecture.md` | App structure, routing, navigation patterns |
| `code-style.md` | Component/hook conventions, import order, naming |
| `security.md` | Payment UI (Flutterwave), PII handling in forms |
| `component-builder` skill | Full component specs, props API, state variants |
| `screen-builder` skill | Screen templates, data fetching, navigation wiring |
| `AGENTS.md` | Product identity, user states, notification rules, analytics events |
