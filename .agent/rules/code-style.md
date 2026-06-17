---
trigger: always_on
---

# code-style.md — Momentum Code Style Rules

Load this file when: writing any code — components, API routes, hooks, utilities, or schemas.

---

## Language & Runtime

- **TypeScript strict mode** on all files. No `any` unless explicitly justified with a comment.
- Node.js 20+. Use ESM (`import/export`) not CommonJS (`require`).
- Target ES2022+. Async/await only — no raw `.then()` chains.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `CheckinCard`, `StreakBadge` |
| Hooks | camelCase, `use` prefix | `useStreak`, `useCheckin` |
| Utilities | camelCase | `formatDate`, `buildCoachPrompt` |
| Constants | SCREAMING_SNAKE | `MAX_DAILY_REMINDERS` |
| Types/Interfaces | PascalCase | `UserState`, `GoalStatus` |
| API routes | kebab-case | `/api/check-ins`, `/api/coach-message` |
| DB columns | snake_case | `user_id`, `task_completed` |
| Files | kebab-case | `checkin-card.tsx`, `use-streak.ts` |
| Folder structure | feature-based, per `architecture.md` | `features/checkins/`, `features/streaks/` |

---

## TypeScript Rules

- Define canonical types in `/src/types/` — import from there, never redefine inline
- Use `interface` for object shapes, `type` for unions/aliases
- Zod schemas are the source of truth for runtime validation; infer TS types from them
- Avoid type assertions (`as`) — narrow types properly

```ts
// ✅ Good
const schema = z.object({ mood: z.number().min(1).max(5) });
type Checkin = z.infer<typeof schema>;

// ❌ Bad
const checkin = data as Checkin;
```

---

## React Rules

- **Functional components only** — no class components
- Co-locate component logic: one file per component with styles and types nearby
- Extract all business logic into custom hooks — components handle rendering only
- No inline styles in JSX. Use Tailwind utility classes.
- Memoize expensive components with `React.memo`, expensive calculations with `useMemo`
- Use `useCallback` for event handlers passed as props
- Optimise for low-bandwidth: lazy-load images, prefetch critical data, show skeleton placeholders
- Handle offline state gracefully — cache last-known state locally, sync on reconnect

---

## Import Organization

Group and order imports consistently:

```
1. React / Next.js
2. Third-party libraries (Zustand, TanStack Query, Zod, etc.)
3. Internal absolute imports (@/features, @/lib, @/components)
4. Relative imports (./, ../)
5. Types (import type { ... })
6. Styles / assets (.css, .png, .svg)
```

Separate groups with a blank line. No unused imports — enforced by ESLint.

```ts
// ✅ Good
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStreak } from '@/features/streaks/use-streak';
import { formatDate } from '@/lib/format-date';
import type { Streak } from '@/types/streak';
```

---

## API Route Rules (Backend)

- Every route must validate input with Zod before touching the database
- Every route must authenticate with `requireAuth` middleware (unless public)
- Route handlers are thin — delegate to service functions in `/lib/services/`
- Never query the database directly from route files — use service layer
- Follow the error response shape defined in `architecture.md` — `{ success, data, error }`
- Always sanitize user input before using it in prompts sent to the AI coach (see `security.md`)

```ts
// ✅ Good structure
router.post('/checkins', requireAuth, async (req, res) => {
  const data = CheckinSchema.parse(req.body);
  const result = await checkinService.create(req.user.id, data);
  res.json({ success: true, data: result });
});
```

---

## Error Handling

- Use a global Express error handler — never send raw errors from route files
- Wrap all async route handlers with `asyncHandler()` utility
- Custom error classes: `AppError(message, statusCode)`, `AuthError`, `ValidationError`
- Frontend: wrap API calls in try/catch and show user-friendly messages, never raw errors
- Never expose stack traces or internal error details to clients (see `architecture.md` error handler)
- Use Sentry or equivalent for server-side error logging

---

## State Management

- Zustand for client state: user session, UI state, notification preferences
- React Query / TanStack Query for all server state: goals, check-ins, streaks, coach
- Keep Zustand stores small and domain-specific — one store per feature
- Derive computed values with selectors — don't store redundant state
- Map user lifecycle states to UI: `onboarding → active → inactive → streak-broken → recovering → milestone-reached → churn-risk`

---

## Comments & Documentation

- Write comments for *why*, not *what*
- Every public function/hook must have a JSDoc comment
- Complex business logic (streak rules, adaptive notification logic, AI coach prompt construction) must be well-commented
- TODO comments are allowed during active development, but must be resolved before merging to main

---

## Testing Standards

- Unit tests for: all utility functions, all service layer functions, Zod schemas
- Integration tests for: all API routes (use supertest)
- Component tests for: any component with conditional rendering or user interaction
- File naming: `[name].test.ts` co-located with the file being tested
- Mock Claude API and Flutterwave calls — never hit live APIs in tests

---

## Performance & Optimization

- Mobile-first: design and test on the smallest screen first, scale up
- API response time target: < 2 seconds for all core flows (check-in, dashboard, coach)
- Lazy-load non-critical components and screens
- Cache: use React Query's built-in caching for server state; Redis for streaks and sessions
- Images: use responsive sizes and appropriate compression — avoid shipping full-resolution images to mobile
- Minimise bundle size: tree-shake unused imports, use dynamic `import()` for heavy modules
- Avatar/icon files should be SVGs where possible (smaller than raster alternatives)

---

## Notification Rules

- Maximum **2 push notifications per day per user** — enforced at the scheduler level
- Adaptive: increment a `notification_ignored_count` counter; reduce frequency after 3 consecutive ignores
- Never use guilt-driven or punitive language (see `design-system.md` for tone guide)
- Milestone days trigger celebration copy (e.g. "🔥 7-day streak! You're on fire")

---

## AI Coach Behaviour (Code Implications)

When building the coaching system, ensure the code enforces these rules:

- System prompt must lead with encouragement, never shame
- After a missed day, coach must offer recovery prompts — never punitive language
- Goal adaptation suggestions must be based on check-in data trends (mood + effort + completion)
- Tone: knowledgeable, warm Nigerian mentor — not a cold bot
- Sanitise all user input before injecting into prompts (see `security.md` for sanitisation helper)
- Rate limit Claude API calls: max 20 requests per hour per user

---

## Accessibility

- All interactive elements must be reachable via keyboard (web) or assistive tech (mobile)
- Use semantic HTML elements on web — never div soup
- Every image must have `alt` text
- Colour is never the sole differentiator — always pair with text or icon
- Maintain minimum contrast ratios as defined in the design tokens
- See `design-system.md` for the full accessibility checklist

---

## Linting & Formatting

- ESLint with `@typescript-eslint` + `eslint-plugin-react-hooks`
- Prettier with: `semi: true`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: 'es5'`
- Husky pre-commit hook: lint + type-check before every commit
- No unused variables, no unused imports — enforced by ESLint

---

## Git Conventions

```
feat: add daily check-in streak update logic
fix: prevent double check-in submission on same date
refactor: extract coaching prompt builder into lib
chore: update Flutterwave SDK to v5
```

Branch naming: `feat/checkin-flow`, `fix/streak-reset-bug`, `refactor/coach-service`

---

## Cross-References

| File | Why |
|---|---|
| `architecture.md` | Folder structure, error response shape, DB/API patterns |
| `design-system.md` | UI/component conventions, tone guide, a11y checklist, empty/loading/error states |
| `security.md` | Auth, payment handling (Flutterwave), PII rules, input sanitisation |
| `AGENTS.md` | User state machine, notification limits, coach behaviour, analytics events |
