---
#name: api-route-scaffolder
#description: Scaffolds complete, production-ready REST API routes for Momentum — including request validation, auth middleware, service layer logic, error handling, and response shaping. Use this skill when building or modifying any backend endpoint. Always load architecture.md, code-style.md, and security.md alongside this skill.
---

## What This Skill Does

Generates the full backend API surface for Momentum. Every route produced by this skill is thin by design — validation, auth, and business logic live in separate layers. The route file is just the contract; the service file is the engine.

## When to Load

- Building a new API endpoint from scratch
- Adding a new route to an existing feature module
- Modifying request/response shape of an existing route
- Adding middleware (auth, rate limiting, validation) to existing routes
- Debugging or refactoring existing API logic
- Scaffolding a new feature module end-to-end (route + service + schema)

---

## API Architecture Recap

```
Request
  → helmet + CORS middleware
  → response compression (gzip/brotli for mobile bandwidth)
  → rate limiter (per-route limits)
  → requireAuth (all protected routes)
  → requireAdmin (admin-only routes)
  → Zod request validator
  → route handler (thin — call service only)
  → service layer (business logic)
  → Prisma (database)
  → Redis (caching where applicable)
  → standardised JSON response
```

---

## Global Error Handler

Register this middleware last in the Express app chain — it catches all unhandled errors thrown from route handlers:

```ts
// middleware/errorHandler.ts
import { AppError } from '@/lib/errors/AppError';
import { ERROR_CODES } from '@/lib/errors/codes';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';     // see: production logging below

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false, data: null,
      error: { code: err.code, message: err.message },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false, data: null,
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: err.errors[0].message },
    });
  }

  logger.error({ err, reqId: req.id });   // structured logging to Sentry
  return res.status(500).json({
    success: false, data: null,
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'An unexpected error occurred.' },
  });
}
```

```ts
// app.ts — registration order
app.use(helmet());
app.use(cors({ origin: whitelist }));
app.use(compression());                    // gzip/brotli for mobile bandwidth
app.use(rateLimiter);
app.use('/api', routes);
app.use(errorHandler); // must be last
```

### Production Logging

Never use `console.log`/`console.error` in production code. Use a structured logger that sends to Sentry:

```ts
// lib/logger.ts
import * as Sentry from '@sentry/node';

export const logger = {
  info: (msg: string, data?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', msg, ...data })); // stdout for logs
  },
  error: (data: { err: Error; reqId?: string }) => {
    Sentry.captureException(data.err, { tags: { reqId: data.reqId } });
    console.error(JSON.stringify({ level: 'error', message: data.err.message, reqId: data.reqId }));
  },
};
```

---

## API Versioning

- All routes live under `/api/` for MVP
- When breaking changes are needed post-MVP, version via `/api/v2/...`
- Never coerce a breaking change into an existing route — add a new one instead
- Mark old routes as deprecated with a `Deprecation: sunset-date` response header

---

## Pagination Response Envelope

Every list endpoint must include pagination metadata in the response:

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

Default `limit=20`, max `limit=100`. Apply to: `GET /api/checkins`, `GET /api/recommendations`, `GET /api/coach/history`.

---

## Standard Response Shape

Every route must return this envelope. No exceptions.

```ts
// Success
{ "success": true, "data": { ... }, "error": null }

// Error
{ "success": false, "data": null, "error": { "code": "GOAL_NOT_FOUND", "message": "Goal not found." } }
```

```ts
// lib/api/response.ts

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}

export function fail(res: Response, code: string, message: string, status = 400) {
  return res.status(status).json({ success: false, data: null, error: { code, message } });
}
```

---

## Middleware Utilities (Pre-built — use these)

```ts
// middleware/requireAuth.ts
export async function requireAuth(req, res, next) { ... }

// middleware/requireAdmin.ts — admin-only routes
export async function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return fail(res, 'FORBIDDEN', 'Admin access required.', 403);
  }
  next();
}

// middleware/requirePremium.ts — gate premium features
export async function requirePremium(req, res, next) {
  if (req.user.subscriptionTier !== 'premium') {
    return fail(res, 'PREMIUM_REQUIRED', 'This feature requires a Premium subscription.', 403);
  }
  next();
}

// middleware/asyncHandler.ts — wraps async route handlers
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// lib/rateLimiter.ts — per-route rate limiting with Redis
export function rateLimit(options: { max: number; windowMs: number; key?: string }) { ... }
```

---

## Complete Route Inventory (MVP)

Build all routes below. No route outside this list should be built for MVP.

### Auth Routes — `/api/auth`
```
POST /signup           → create user + return tokens
POST /login            → verify credentials + return tokens
POST /refresh          → rotate refresh token
POST /logout           → invalidate refresh token
POST /forgot-password  → send reset email
POST /reset-password   → verify reset token + update password
```

### Onboarding Routes — `/api/onboarding`
```
PATCH /step            → save one onboarding step (idempotent per step)
GET   /status          → return current step + completion %
POST  /complete        → mark onboarding done + transition user state to 'active' + trigger first AI coaching message
```

Step data is stored as a JSON column (`onboarding_data`) on the User table. Each step overwrites its own key:
```json
{ "name": "Tee", "goal": "Learn UI design", "skillLevel": "beginner", "learningStyle": "visual", "dailyTime": 15, "reminderTime": "08:00", "consentAccepted": true }
```
This makes `PATCH /step` naturally idempotent — re-sending the same step is safe.

### Goal Routes — `/api/goals`
```
GET    /               → list user's goals (active + paused, exclude deleted)
POST   /               → create new goal (free: max 1 active, premium: unlimited)
GET    /:id            → get single goal with progress
PATCH  /:id            → update title or progress_percent
PATCH  /:id/pause      → set status = 'paused'
PATCH  /:id/resume     → set status = 'active'
DELETE /:id            → soft delete (set deletedAt)
```

### Check-in Routes — `/api/checkins`
```
POST   /               → submit daily check-in (idempotent per user+goal+date)
GET    /               → list check-ins (query: ?goalId=&from=&to=&page=&limit=)  ← paginated
GET    /today          → return today's check-in status for all active goals
```

### Streak Routes — `/api/streaks`
```
GET    /:userId        → get streak data for user (cached in Redis)
```
Note: Streaks are updated internally after a check-in — no external update route.

### Coach Routes — `/api/coach`
```
POST   /message        → generate AI coaching response for latest check-in (rate-limited: 20/hr)
GET    /history        → last 10 coach messages for user (paginated)
```

### Recommendation Routes — `/api/recommendations`
```
GET    /               → get personalised recommendation list for user (query: ?page=&limit=) ← paginated, weekly cache
POST   /:id/click      → record recommendation click (analytics)
```

### Progress / Dashboard Routes — `/api/dashboard`
```
GET    /               → aggregate dashboard data (streak + week summary + mood trend + coach message)
GET    /weekly-summary → weekly summary data (on-demand, used for PDF)
GET    /monthly-summary → monthly summary data (on-demand, used for PDF)
```

### Payment Routes — `/api/payments`
```
POST   /initiate            → create Flutterwave payment link for premium upgrade (10 req/hr)
GET    /verify/:chargeId    → verify charge via Flutterwave API, unlock premium if successful (10 req/hr)
POST   /webhook             → Flutterwave webhook handler (signature verified, no rate limit)
POST   /cancel              → cancel premium subscription, downgrade to free (3 req/hr)
POST   /refund              → admin only: refund a payment and downgrade user (5 req/hr)
GET    /status              → return user's current subscription tier + expiry
```

### File Upload Routes — `/api/uploads`
```
POST   /avatar         → upload user avatar (5MB max, jpeg/png/webp only) → return Cloudinary URL
```
See `security.md` (File Upload Security) for MIME whitelist, size limits, and signed URL requirements.

### Account Routes — `/api/account`
```
GET    /               → get user profile data
PATCH  /               → update name, timezone, reminder time, learning preferences
PATCH  /notification-preferences → update reminder frequency, quiet hours, channel preferences
PATCH  /password       → change password (requires current password)
GET    /export         → generate GDPR/NDPR data export (async job via Bull/BullMQ, returns job ID)
DELETE /               → soft-delete account + schedule hard-delete in 30 days
```

The export flow:
1. `GET /api/account/export` → enqueues a Bull/BullMQ job, returns `{ jobId }`
2. User polls `GET /api/account/export/:jobId/status` → `{ status: 'pending' | 'completed', downloadUrl?: string }`
3. When completed, the download URL points to a pre-signed S3/Cloudinary URL that expires in 24 hours

### Health Route — `/api/health`
```
GET    /               → return server status, DB connectivity, uptime (no auth, no rate limit)
```

Response shape:
```json
{ "success": true, "data": { "status": "ok", "db": "connected", "uptime": 123456, "version": "1.0.0" }, "error": null }
```

### Admin Routes — `/api/admin` (internal only, requireAdmin middleware)
```
GET    /users                   → list all users (paginated, PII-masked)
GET    /users/:id               → get user details (PII-masked)
GET    /analytics/dashboard     → product-wide stats (active users, check-in rate, premium conversion)
GET    /analytics/coach-quality → AI response quality review queue
GET    /recommendations         → list all recommendations in catalog
POST   /recommendations         → add new recommendation
PATCH  /recommendations/:id     → update recommendation
DELETE /recommendations/:id     → deactivate recommendation
```
All admin routes are protected by `requireAdmin` middleware. Admin role is set in the JWT at token creation. Never hardcode admin credentials in the codebase.

---

## Analytics Events Reference

Fire these events at the specified routes. All events must include `userId`, `timestamp`, and event-specific context. See `AGENTS.md` section 8 for the canonical event list.

| Event | Triggered By | Context Data |
|---|---|---|
| `onboarding_completed` | `POST /api/onboarding/complete` | `{ stepsCompleted, timeSpentSeconds }` |
| `goal_created` | `POST /api/goals` | `{ goalId, titleLength }` |
| `daily_checkin_completed` | `POST /api/checkins` | `{ goalId, taskCompleted, mood, effortLevel }` |
| `streak_started` | First check-in after a break (internal) | `{ streakCount: 1 }` |
| `streak_broken` | Missed 2+ consecutive days (cron) | `{ previousStreak, longestStreak }` |
| `milestone_reached` | Streak hits 3, 7, 14, 21, 30, 60, 100, 365 | `{ streakCount, milestoneType }` |
| `recommendation_clicked` | `POST /api/recommendations/:id/click` | `{ recommendationId, type, position }` |
| `churn_risk_detected` | 5+ days no check-in (cron) | `{ daysSinceLastCheckin, previousStreak }` |
| `upgrade_initiated` | `POST /api/payments/initiate` | `{ plan, amount, currency: 'NGN' }` |
| `upgrade_completed` | `GET /api/payments/verify/:chargeId` | `{ transactionId, plan }` |
| `upgrade_cancelled` | `POST /api/payments/cancel` | `{ plan, daysActive }` |
| `payment_refunded` | `POST /api/payments/refund` | `{ paymentId, amountKobo, reason }` |

```ts
// lib/analytics.ts
import { posthog } from '@/lib/posthog';  // or any analytics provider

export const analytics = {
  track: (event: string, properties: Record<string, unknown>) => {
    posthog.capture(event, properties);
  },
};
```

---

## User State Machine Integration

Map every route that changes user state to the lifecycle defined in `AGENTS.md`:

```
onboarding → active → inactive → streak-broken → recovering → milestone-reached → churn-risk
```

| Route | State Transition |
|---|---|
| `POST /api/onboarding/complete` | Sets `user.state = 'active'` |
| Streak cron job (2+ missed days) | Sets `user.state = 'streak-broken'` |
| `GET /api/coach/message` (after recovery prompt responded) | May set `user.state = 'recovering'` |
| No check-in for 5+ days (cron) | Sets `user.state = 'churn-risk'` |
| Milestone reached (internal) | Sets `user.state = 'milestone-reached'` (transient, reverts to `active` after 24h) |

---

## Route + Service File Template

### Route File (thin)

```ts
// src/features/goals/goals.routes.ts
import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { requireAuth } from '@/middleware/requireAuth';
import { requirePremium } from '@/middleware/requirePremium';
import { rateLimit } from '@/lib/rateLimiter';
import { goalsService } from './goals.service';
import { CreateGoalSchema, UpdateGoalSchema } from './goals.schemas';
import { ok, fail } from '@/lib/api/response';

const router = Router();

// GET /api/goals — list active goals
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const goals = await goalsService.listByUser(req.user.id);
  return ok(res, goals);
}));

// POST /api/goals — create goal
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const data = CreateGoalSchema.parse(req.body);
  const goal = await goalsService.create(req.user.id, data, req.user.subscriptionTier);
  return ok(res, goal, 201);
}));

// PATCH /api/goals/:id/pause
router.patch('/:id/pause', requireAuth, asyncHandler(async (req, res) => {
  const goal = await goalsService.pause(req.user.id, req.params.id);
  if (!goal) return fail(res, 'GOAL_NOT_FOUND', 'Goal not found.', 404);
  return ok(res, goal);
}));

export { router as goalsRouter };
```

### Schema File

```ts
// src/features/goals/goals.schemas.ts
import { z } from 'zod';

export const CreateGoalSchema = z.object({
  title: z.string().min(3).max(200).trim(),
}).strict();

export const UpdateGoalSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
}).strict();

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
```

### Service File (business logic lives here)

```ts
// src/features/goals/goals.service.ts
import { db } from '@/lib/db';
import { analytics } from '@/lib/analytics';
import { AppError } from '@/lib/errors';
import type { CreateGoalInput } from './goals.schemas';

const FREE_TIER_GOAL_LIMIT = 1;

export const goalsService = {

  async listByUser(userId: string) {
    return db.goal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, progressPercent: true, createdAt: true },
    });
  },

  async create(userId: string, data: CreateGoalInput, tier: string) {
    // Enforce free tier limit
    if (tier === 'free') {
      const activeCount = await db.goal.count({
        where: { userId, status: 'active', deletedAt: null },
      });
      if (activeCount >= FREE_TIER_GOAL_LIMIT) {
        throw new AppError('GOAL_LIMIT_REACHED', 'Free accounts can only have 1 active goal. Upgrade to Premium for unlimited goals.', 403);
      }
    }

    const goal = await db.goal.create({
      data: { userId, ...data },
    });

    await analytics.track('goal_created', { userId, goalId: goal.id });
    return goal;
  },

  async pause(userId: string, goalId: string) {
    // Verify ownership before update
    const goal = await db.goal.findFirst({ where: { id: goalId, userId, deletedAt: null } });
    if (!goal) return null;

    return db.goal.update({
      where: { id: goalId },
      data: { status: 'paused' },
    });
  },

};
```

---

## Route-Specific Implementation Notes

### Check-in Route (idempotency is critical)

```ts
// POST /api/checkins
// The @@unique([userId, goalId, date]) constraint in the schema handles DB-level idempotency
// But we should check first and return existing record rather than throw a constraint error

async function submitCheckin(userId: string, data: CheckinInput) {
  const existing = await db.checkin.findFirst({
    where: { userId, goalId: data.goalId, date: new Date(data.date) },
  });

  if (existing) {
    // Idempotent — return existing, do not re-trigger streak or coach logic
    return { checkin: existing, isNew: false };
  }

  const checkin = await db.$transaction(async (tx) => {
    const newCheckin = await tx.checkin.create({ data: { userId, ...data } });

    if (data.taskCompleted) {
      await updateStreak(userId, data.date, tx); // from progress-tracker skill
    }

    return newCheckin;
  });

  await analytics.track('daily_checkin_completed', { userId, goalId: data.goalId, taskCompleted: data.taskCompleted, mood: data.mood });

  // Fire AI coach response async — don't block the check-in response
  generateCoachResponse(userId, checkin.id).catch((err) => {
    logger.error({ err, context: 'coach_response_after_checkin' });
  });

  return { checkin, isNew: true };
}
```

### Coach Message Route (async AI call)

```ts
// POST /api/coach/message
// Rate limit: 20 req/hour per user
router.post(
  '/message',
  requireAuth,
  rateLimit({ max: 20, windowMs: 60 * 60 * 1000, key: 'coach' }),
  asyncHandler(async (req, res) => {
    const message = await coachService.generateForUser(req.user.id);
    return ok(res, { message });
  })
);
```

### Coach History Route

```ts
// GET /api/coach/history — last 10 messages, paginated
router.get(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page = '1', limit = '10' } = req.query;
    const result = await coachService.getHistory(req.user.id, Number(page), Number(limit));
    return ok(res, result);
  })
);
```

Service layer:

```ts
async function getHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    db.coachMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, content: true, createdAt: true },
    }),
    db.coachMessage.count({ where: { userId } }),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + messages.length < total,
      hasPrev: page > 1,
    },
  };
}
```

### Dashboard Route (aggregated, cached)

```ts
// GET /api/dashboard
// Heavy query — cache the full response per user for 5 minutes in Redis

async function getDashboard(userId: string): Promise<DashboardData> {
  const cacheKey = `dashboard:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [user, goals, streak, recentCheckins, coachMessage] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, state: true } }),
    db.goal.findMany({ where: { userId, status: 'active', deletedAt: null } }),
    db.streak.findUnique({ where: { userId } }),
    db.checkin.findMany({
      where: { userId, date: { gte: subDays(new Date(), 14) } },
      orderBy: { date: 'asc' },
    }),
    db.coachMessage.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  const data = assembleDashboardData(user, goals, streak, recentCheckins, coachMessage);

  await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min TTL
  return data;
}
```

### Payment Webhook Route (no auth, signature verified)

```ts
// POST /api/payments/webhook
// Must NOT use requireAuth middleware — Flutterwave calls this, not a user
// See security.md for transaction_id dedup (idempotency)

router.post('/webhook',
  express.raw({ type: 'application/json' }), // raw body for signature verification
  asyncHandler(async (req, res) => {
    const hash = crypto
      .createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY!)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['verif-hash']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      // Verify idempotency via webhook_events table (see security.md and flutterwave-integration skill)
      const alreadyProcessed = await db.webhookEvent.findUnique({
        where: { webhookId: event.data.id },
      });
      if (alreadyProcessed) {
        return res.status(200).json({ received: true, duplicate: true });
      }

      await db.webhookEvent.create({
        data: { webhookId: event.data.id, type: 'charge.completed' },
      });

      await paymentService.handleSuccessfulPayment(event.data);
    }

    return res.status(200).json({ received: true });
  })
);
```

### File Upload Route

```ts
// POST /api/uploads/avatar
// See security.md (File Upload Security) for type/size enforcement

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_TYPES.includes(file.mimetype));
  },
});

router.post(
  '/avatar',
  requireAuth,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) return fail(res, 'NO_FILE', 'No file provided.', 400);

    const result = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `users/${req.user.id}/avatar`, transformation: { width: 200, height: 200, crop: 'fill' } },
        (err, result) => (err ? reject(err) : resolve(result!))
      ).end(req.file!.buffer);
    });

    await db.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.secure_url },
    });

    return ok(res, { url: result.secure_url });
  })
);
```

---

## Prisma Connection Pooling Configuration

Configure Prisma with connection pooling for serverless and production deployments:

```ts
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

For Vercel serverless: append `?pgbouncer=true&connection_limit=5` to `DATABASE_URL` and use PgBouncer as a connection pooler. For Railway/Render: configure pool size via `DATABASE_POOL_MIN=2` and `DATABASE_POOL_MAX=10` environment variables.

---

## Error Codes Reference

Define all error codes in a single constants file. Use these in service layer throws.

```ts
// lib/errors/codes.ts
export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS:    'INVALID_CREDENTIALS',
  TOKEN_EXPIRED:          'TOKEN_EXPIRED',
  UNAUTHORIZED:           'UNAUTHORIZED',
  FORBIDDEN:              'FORBIDDEN',

  // Goals
  GOAL_NOT_FOUND:         'GOAL_NOT_FOUND',
  GOAL_LIMIT_REACHED:     'GOAL_LIMIT_REACHED',

  // Check-ins
  CHECKIN_ALREADY_EXISTS: 'CHECKIN_ALREADY_EXISTS',
  CHECKIN_NOT_FOUND:      'CHECKIN_NOT_FOUND',

  // Payments
  PAYMENT_FAILED:         'PAYMENT_FAILED',
  PREMIUM_REQUIRED:       'PREMIUM_REQUIRED',
  INVALID_WEBHOOK:        'INVALID_WEBHOOK',

  // Uploads
  NO_FILE:                'NO_FILE',
  INVALID_FILE_TYPE:      'INVALID_FILE_TYPE',
  FILE_TOO_LARGE:         'FILE_TOO_LARGE',

  // Generic
  NOT_FOUND:              'NOT_FOUND',
  VALIDATION_ERROR:       'VALIDATION_ERROR',
  RATE_LIMITED:           'RATE_LIMITED',
  INTERNAL_ERROR:         'INTERNAL_ERROR',
} as const;
```

---

## Route Testing Pattern

Every route must have integration tests covering: success case, auth failure, validation failure, and business-rule rejection. Mock the Claude API and Flutterwave calls in all tests.

```ts
// goals.routes.test.ts
describe('POST /api/goals', () => {
  it('creates a goal for authenticated user', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ title: 'Learn Product Design' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Learn Product Design');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/goals').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when free user already has 1 active goal', async () => {
    // seed one existing active goal for the free test user
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({ title: 'Second Goal' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('GOAL_LIMIT_REACHED');
  });

  it('returns 422 when title is missing', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${testToken}`)
      .send({});

    expect(res.status).toBe(422);
  });
});
```

Test setup/teardown pattern:

```ts
// helpers/test-setup.ts
beforeEach(async () => {
  await db.$transaction([
    db.checkin.deleteMany(),
    db.goal.deleteMany(),
    db.streak.deleteMany(),
    db.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await db.$disconnect();
});
```

---

## Cross-References

| File / Resource | Why |
|---|---|
| `architecture.md` | Route inventory (canonical), error shape, pagination, DB/API patterns |
| `code-style.md` | API route conventions, error handling patterns, testing standards |
| `security.md` | Payment webhook (Flutterwave), rate limiting, file upload rules, input sanitisation |
| `design-system.md` | Dashboard data shape, empty/loading/error UI states |
| `AGENTS.md` | Analytics event list (section 8), user state machine (section 5), monetisation tiers |
| `ai-plan-generator` skill | Coach route async AI call, prompt structure |
| `progress-tracker` skill | Streak update logic, milestone detection |
| `flutterwave-integration` skill | Payment flow, webhook handling, premium unlock |
