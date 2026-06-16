---
trigger: always_on
---

# architecture.md — Momentum Architecture Rules

Load this file when: scaffolding new features, designing system structure, setting up routing, or making infrastructure decisions.

---

## Application Architecture

Momentum follows a **feature-based modular architecture**. Group files by domain, not by type.

```
/src
  /features
    /onboarding
    /checkins
    /streaks
    /coaching
    /recommendations
    /dashboard
    /auth
    /payments          ← Flutterwave only
  /components          ← shared, reusable UI only
  /lib                 ← utilities, helpers, API clients
  /hooks               ← shared custom hooks
  /stores              ← global state (Zustand or Redux Toolkit)
  /types               ← TypeScript interfaces (canonical schemas)
  /styles              ← design tokens, global CSS
```

---

## Frontend Architecture

- **Framework**: Next.js App Router
- **State management**: Zustand for local/feature state; React Query for server state
- **Navigation**: Next.js routing
- **Forms**: React Hook Form + Zod validation

### Routing Structure (Web)

```
/                      → landing / marketing
/auth/signup           → registration + onboarding
/auth/login
/app/dashboard         → main dashboard (protected)
/app/checkin           → daily check-in flow
/app/goals             → goal management
/app/coach             → AI coach chat interface
/app/progress          → streak + analytics view
/app/settings          → profile, notifications, billing
/app/upgrade           → premium upgrade via Flutterwave
```

---

## Backend Architecture

- **Runtime**: Node.js 20+
- **Framework**: Express.js or Next.js API routes
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis (streaks, sessions, rate limiting)
- **Auth**: JWT (access token 15min, refresh token 7 days)
- **File uploads**: Multipart → Cloudinary or Supabase Storage

### API Route Structure

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/goals
POST   /api/goals
PATCH  /api/goals/:id
DELETE /api/goals/:id

POST   /api/checkins
GET    /api/checkins?userId=&date=&page=&limit=   ← paginated

GET    /api/streaks/:userId       ← cached in Redis

POST   /api/coach/message         ← AI response via Claude API
GET    /api/recommendations?page=&limit=   ← paginated, weekly refreshed list

POST   /api/payments/initiate          ← Flutterwave only
GET    /api/payments/verify/:chargeId  ← verify charge and unlock premium
POST   /api/payments/webhook           ← Flutterwave webhook handler
POST   /api/payments/cancel            ← cancel premium subscription
POST   /api/payments/refund            ← admin only — refund payment
GET    /api/payments/status            ← current subscription tier + expiry

GET    /api/account               ← user profile
PATCH  /api/account               ← update name, timezone, preferences
PATCH  /api/account/notification-preferences  ← reminder time, frequency, channel
DELETE /api/account               ← soft-delete

GET    /api/reports/weekly
GET    /api/reports/monthly

GET    /api/health                ← health check (no auth)
```

---

## Pagination Strategy

All list endpoints returning multiple resources must support pagination using cursor-based or offset-based pagination:

- **Offset pagination** for stable lists (goals, check-ins): `?page=1&limit=20`
- **Cursor pagination** for high-volume, real-time data (coach history): `?cursor=<id>&limit=20`
- Default: `limit=20`, maximum: `limit=100`
- Response must include pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "error": null
}
```

Routes requiring pagination: `GET /api/checkins`, `GET /api/recommendations`, `GET /api/coach/history`.

---

## Database Design Principles

- Use UUIDs as primary keys — never auto-increment integers
- All timestamps: `created_at`, `updated_at` on every table
- Soft-delete with `deleted_at` nullable column — never hard-delete user data
- Streak logic lives in the database + Redis layer, not in UI components
- Index on: `user_id`, `date`, `status`, `goal_id` columns

---

## AI Coaching Architecture

```
User check-in data
       ↓
Build context window (last 7 days of check-ins + goal + streak)
       ↓
POST to Claude API (claude-sonnet-4-20250514)
       ↓
Parse response → store in coaching_messages table
       ↓
Render in coach UI
```

System prompt must include: user name, goal, skill level, current streak, recent mood, and most recent check-in notes.

---

## Notification Architecture

- Scheduled reminders via cron job (node-cron or Vercel cron)
- FCM for push delivery
- Store notification preferences per user: time, frequency, channel
- Adaptive logic: track `notification_ignored_count` per user; reduce frequency after 3 consecutive ignores
- Max 2 push notifications per day per user — enforce at the scheduler level

---

## Database Connection Pooling

Prisma must be configured with connection pooling for serverless and production deployments:

```ts
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
  // Connection pool config (for PgBouncer-compatible serverless)
  connectionLimit: 5,
  poolTimeout: 10,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

For Vercel serverless: use `@prisma/accelerate` or connect via PgBouncer with `?pgbouncer=true&connection_limit=5` in the connection string.

---

## Scalability Guidelines

- Stateless API servers — all session state in Redis or JWT
- Streak updates must be idempotent (safe to call multiple times on same date)
- Recommendation engine runs as a background job, not on request
- PDF report generation is async — queue job, notify user when ready
- Design for 1M users from day one at the data model level

---

## Error Handling Standards

- All API responses follow this shape:
```json
{ "success": true, "data": {}, "error": null }
{ "success": false, "data": null, "error": { "code": "string", "message": "string" } }
```
- Use HTTP status codes correctly: 200, 201, 400, 401, 403, 404, 422, 429, 500
- Never expose stack traces or internal errors to clients
- Log errors to a centralised service (e.g. Sentry)
- Offline support: cache last known state locally; sync on reconnect

### Global Error Boundary

A catch-all Express error handler must be registered as the last middleware:

```ts
// middleware/errorHandler.ts
import { AppError } from '@/lib/errors/AppError';
import { ERROR_CODES } from '@/lib/errors/codes';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      error: { code: err.code, message: err.message },
    });
  }

  if (err instanceof z.ZodError) {
    return res.status(422).json({
      success: false,
      data: null,
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: err.errors[0].message },
    });
  }

  console.error('[UNHANDLED_ERROR]', err);
  return res.status(500).json({
    success: false,
    data: null,
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'An unexpected error occurred.' },
  });
}
```

Register in app setup:
```ts
app.use(helmet());
app.use(cors({ origin: whitelist }));
app.use(rateLimiter);
app.use('/api', routes);
app.use(errorHandler); // must be last
```

---

## Environment Variables (Required)

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
ANTHROPIC_API_KEY=
FLW_SANDBOX_CLIENT_ID=
FLW_SANDBOX_CLIENT_SECRET=
FLW_PROD_CLIENT_ID=
FLW_PROD_SECRET_KEY=
FLW_SECRET_HASH=
FCM_SERVER_KEY=
CLOUDINARY_URL=
```

---

## Cross-References

| File / Resource | Why |
|---|---|
| `code-style.md` | Code conventions, component/hook patterns, naming, import order |
| `design-system.md` | UI/component rules, token values, empty/loading/error states |
| `security.md` | Auth, payment handling (Flutterwave), PII rules, input sanitisation |
| `AGENTS.md` | Product identity, user state machine, notification rules, analytics events |
| `component-builder` skill | Component inventory, props API, state variants |
| `screen-builder` skill | Screen templates, data fetching, navigation wiring |
| `flutterwave-integration` skill | Payment flow implementation |
| `auth-system-builder` skill | Auth flow implementation |