---
#name: db-migration-runner
#description: Creates, validates, and runs PostgreSQL database migrations for Momentum using Prisma. Use this skill when defining or modifying any database table, adding indexes, changing column types, seeding reference data, or running schema changes safely in any environment. Always load architecture.md alongside this skill.
---

## What This Skill Does

Manages the full lifecycle of Momentum's PostgreSQL schema — from writing type-safe Prisma migrations to running them safely across dev, staging, and production. Covers all tables defined in the PRD, their relationships, indexes, constraints, and seed data.

## When to Load

- Creating a new database table or modifying an existing one
- Adding or removing columns, indexes, or constraints
- Writing seed data for development or staging
- Running or rolling back migrations
- Debugging schema drift between environments
- Setting up the database from scratch on a new environment

---

## Database Stack

- **ORM**: Prisma (v5+)
- **Database**: PostgreSQL 15+
- **Caching layer**: Redis (streaks, sessions, rate limiting — not managed by Prisma)
- **Migration strategy**: `prisma migrate dev` (development), `prisma migrate deploy` (CI/production)
- **Schema file**: `prisma/schema.prisma` — single source of truth
- **Shadow database**: Prisma requires a shadow DB for `migrate dev`. Set `shadowDatabaseUrl` in environments where the dev database is shared or production-like.

---

## Canonical Prisma Schema

This is the full MVP schema. Every table maps directly to the PRD data schemas. Do not add fields not listed here without explicit product instruction.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────────────

enum SkillLevel {
  beginner
  intermediate
  advanced
}

enum LearningStyle {
  video
  reading
  practice
  mixed
}

enum GoalStatus {
  active
  paused
  completed
}

enum UserStatus {
  onboarding
  active
  inactive
  streak_broken
  recovering
  milestone_reached
  churn_risk
}

enum RecommendationType {
  mentor
  course
  workshop
  resource
}

enum SubscriptionTier {
  free
  premium
}

enum CoachTrigger {
  checkin
  milestone
  recovery
  weekly
}

// ─── TABLES ───────────────────────────────────────────────

model User {
  id                String          @id @default(uuid())
  email             String          @unique
  passwordHash      String          @map("password_hash")
  name              String
  skillLevel        SkillLevel?     @map("skill_level")
  learningStyle     LearningStyle?  @map("learning_style")
  dailyTimeMinutes  Int?            @map("daily_time_minutes")
  timezone          String          @default("Africa/Lagos")
  status            UserStatus      @default(onboarding)
  subscriptionTier  SubscriptionTier @default(free) @map("subscription_tier")
  onboardingStep    Int             @default(0) @map("onboarding_step")
  onboardingData    Json?           @map("onboarding_data")  // key-value store per step (api-route-scaffolder)
  reminderTime      String?         @map("reminder_time")       // "HH:MM" 24h
  notificationIgnoredCount Int      @default(0) @map("notification_ignored_count")
  flwCustomerId     String?         @map("flw_customer_id")       // Flutterwave customer ID, cached after first payment
  premiumExpiresAt  DateTime?       @map("premium_expires_at")   // mirror of latest payment.periodEnd, for fast lookups
  consentAcceptedAt DateTime?       @map("consent_accepted_at")
  consentVersion    String?         @map("consent_version")
  createdAt         DateTime        @default(now()) @map("created_at")
  updatedAt         DateTime        @updatedAt @map("updated_at")
  deletedAt         DateTime?       @map("deleted_at")          // soft delete

  goals             Goal[]
  checkins          Checkin[]
  streak            Streak?
  coachMessages     CoachMessage[]
  payments          Payment[]
  recommendations  UserRecommendation[]
  refreshTokens     RefreshToken[]
  passwordResetTokens PasswordResetToken[]
  notificationLogs  NotificationLog[]
  webhookEvents     WebhookEvent[]

  @@index([email])
  @@index([status])
  @@index([deletedAt])
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}

model Goal {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  title           String
  status          GoalStatus  @default(active)
  progressPercent Int         @default(0) @map("progress_percent")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  deletedAt       DateTime?   @map("deleted_at")

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  checkins        Checkin[]

  @@index([userId])
  @@index([userId, status])
  @@index([deletedAt])
  @@map("goals")
}

model Checkin {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  goalId        String    @map("goal_id")
  date          DateTime  @db.Date                // date only, no time
  taskCompleted Boolean   @default(false) @map("task_completed")
  mood          Int?                              // 1–5
  notes         String?                           // encrypted at app layer (AES-256-GCM, see security.md)
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

model CoachMessage {
  id           String       @id @default(uuid())
  userId       String       @map("user_id")
  content      String
  trigger      CoachTrigger
  inputTokens  Int?         @map("input_tokens")    // for cost tracking (ai-plan-generator)
  outputTokens Int?         @map("output_tokens")
  costUsd      Float?       @map("cost_usd")
  createdAt    DateTime     @default(now()) @map("created_at")

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("coach_messages")
}

model Recommendation {
  id          String              @id @default(uuid())
  type        RecommendationType
  title       String
  url         String?
  tags        String[]            @default([])   // array of tag strings
  skillLevel  SkillLevel?         @map("skill_level")
  isLocal     Boolean             @default(false) @map("is_local") // Nigeria-specific
  isActive    Boolean             @default(true) @map("is_active")
  createdAt   DateTime            @default(now()) @map("created_at")
  updatedAt   DateTime            @updatedAt @map("updated_at")

  userLinks   UserRecommendation[]

  @@index([type])
  @@index([skillLevel])
  @@index([isActive])
  @@map("recommendations")
}

model UserRecommendation {
  id               String         @id @default(uuid())
  userId           String         @map("user_id")
  recommendationId String         @map("recommendation_id")
  clickedAt        DateTime?      @map("clicked_at")
  shownAt          DateTime       @default(now()) @map("shown_at")

  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  recommendation   Recommendation @relation(fields: [recommendationId], references: [id], onDelete: Cascade)

  @@unique([userId, recommendationId])
  @@index([userId])
  @@map("user_recommendations")
}

model Payment {
  id               String         @id @default(uuid())
  userId           String         @map("user_id")
  flutterwaveTxRef String         @unique @map("flutterwave_tx_ref")
  flutterwaveTxId  String?        @map("flutterwave_tx_id")
  amount           Int                             // in kobo (NGN * 100)
  currency         String         @default("NGN")
  status           String                          // "pending" | "successful" | "failed" | "refunded"
  plan             String                          // "premium_monthly" | "premium_annual"
  periodStart      DateTime?      @map("period_start")  // premium subscription start
  periodEnd        DateTime?      @map("period_end")    // premium subscription expiry
  verifiedAt       DateTime?      @map("verified_at")
  createdAt        DateTime       @default(now()) @map("created_at")

  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([flutterwaveTxRef])
  @@map("payments")
}

model WebhookEvent {
  id          String   @id @default(uuid())
  webhookId   String   @unique                                       // FLW webhook event id — for idempotency
  type        String
  userId      String?  @map("user_id")                               // optional — filled when event relates to a known user
  processedAt DateTime @default(now()) @map("processed_at")

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([webhookId])
  @@index([processedAt])
  @@map("webhook_events")
}

model NotificationLog {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  type        String                             // "reminder" | "milestone" | "recovery"
  wasDelivered Boolean  @default(true) @map("was_delivered")  // false if device offline / FCM failed
  sentAt      DateTime  @default(now()) @map("sent_at")
  openedAt    DateTime? @map("opened_at")
  dismissed   Boolean   @default(false)

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, sentAt])
  @@index([userId, sentAt, wasDelivered])
  @@map("notification_logs")
}
```

---

## Migration Workflow

### Creating a new migration

```bash
# 1. Edit prisma/schema.prisma with your changes

# 2. Generate and apply migration (dev only)
npx prisma migrate dev --name <descriptive_name>

# Naming convention:
npx prisma migrate dev --name add_effort_level_to_checkins
npx prisma migrate dev --name add_is_local_to_recommendations
npx prisma migrate dev --name create_notification_logs_table
```

### Deploying to staging / production

```bash
# Never use `migrate dev` in production — it can reset data
npx prisma migrate deploy

# In CI/CD pipeline (run before starting the app):
npx prisma migrate deploy && node dist/index.js
```

### Viewing migration status

```bash
npx prisma migrate status        # see which migrations are applied
npx prisma studio                # visual DB browser (dev only)
npx prisma db pull               # introspect existing DB → update schema (use with care)
npx prisma migrate diff          # compare schema drift between environments
```

### Rolling Back a Failed Migration

If a migration fails in production:

1. **Assess**: run `npx prisma migrate status` to see which migration failed and why
2. **Rollback**: if the migration applied partially, manually undo the SQL changes using a new migration:

```sql
-- migrations/rollback_<failed_migration_name>/migration.sql
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_data;
DROP TABLE IF EXISTS refresh_tokens;
-- ... reverse of whatever the failed migration did
```

3. **Mark as resolved**: tell Prisma the failed migration is rolled back so it doesn't block future migrations:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

4. **Fix and retry**: correct the schema, create a new migration with a new name, deploy again

For non-destructive failures (e.g., index creation on a large table timing out), you can mark the migration as applied after manually running the SQL:

```bash
npx prisma migrate resolve --applied <migration_name>
```

Never delete a migration file from the `prisma/migrations` directory — it breaks the migration history chain.

---

## Migration Naming Conventions

```
create_[table]_table                    → new table
add_[column]_to_[table]                 → add column
remove_[column]_from_[table]            → drop column (risky — see safety rules)
add_index_[column]_on_[table]           → new index
change_[column]_type_in_[table]         → type change (very risky)
seed_[table]_[description]              → data-only migration
```

---

## Safety Rules for Production Migrations

### Safe operations (run without fear)
- Adding a new nullable column
- Adding a new table
- Adding an index
- Expanding an enum with new values
- Renaming: only via add + backfill + remove sequence

### Risky operations (require review + maintenance window)
- Dropping a column → soft-deprecate first (stop writes), then drop after 1 deploy cycle
- Renaming a column → create new, backfill, update app code, then drop old
- Changing column type → only via new column + data migration + swap
- Adding a NOT NULL constraint → add as nullable, backfill, then add constraint
- Large table indexes → use `CREATE INDEX CONCURRENTLY` via raw SQL migration

```prisma
// Raw SQL migration for concurrent index (avoids table lock)
-- migration.sql
CREATE INDEX CONCURRENTLY idx_checkins_user_date
ON checkins (user_id, date);
```

### Never do in production
- `prisma migrate reset` — wipes all data
- `prisma db push` — bypasses migration history
- Running migrations with `--force-reset`
- Dropping tables without a prior soft-delete period

---

## Cascade Delete Strategy

All child tables use `onDelete: Cascade` because Momentum uses **soft delete** (via `deletedAt`). Hard deletion only occurs after the 30-day grace period via a background job. The cascade ensures that when the background job hard-deletes a user, all their associated records are cleaned up in a single transaction rather than leaving orphaned rows.

The cascade chain:
```
User → Goal, Checkin, Streak, CoachMessage, Payment, RefreshToken, PasswordResetToken,
       UserRecommendation, NotificationLog
Goal → Checkin
Recommendation → UserRecommendation
```

Never hard-delete a user manually — always use the `DELETE /api/account` endpoint which triggers the soft-delete + scheduled cleanup.

---

## Seed Data

### Development seed (`prisma/seed.ts`)

```ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const db = new PrismaClient();
const BCRYPT_COST = 4; // lower cost for dev speed (use 12 in production signup)

async function main() {
  // Seed test user
  const user = await db.user.upsert({
    where: { email: 'test@momentum.app' },
    update: {},
    create: {
      email: 'test@momentum.app',
      passwordHash: await bcrypt.hash('TestPass123!', BCRYPT_COST),
      name: 'Test User',
      skillLevel: 'beginner',
      learningStyle: 'mixed',
      dailyTimeMinutes: 30,
      timezone: 'Africa/Lagos',
      status: 'active',
      onboardingStep: 7,
      onboardingData: {
        name: 'Test User',
        goal: 'Learn UI/UX Design',
        skillLevel: 'beginner',
        learningStyle: 'mixed',
        dailyTime: 30,
        reminderTime: '08:00',
        consentAccepted: true,
      },
      consentAcceptedAt: new Date(),
      consentVersion: '1.0',
    },
  });

  // Seed active goal
  await db.goal.upsert({
    where: { id: 'seed-goal-001' },
    update: {},
    create: {
      id: 'seed-goal-001',
      userId: user.id,
      title: 'Learn UI/UX Design',
      status: 'active',
      progressPercent: 20,
    },
  });

  // Seed streak record
  await db.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentStreak: 5,
      longestStreak: 14,
    },
  });

  // Seed sample recommendations
  const recommendations = [
    { type: 'course' as const, title: 'Google UX Design Certificate', tags: ['ux', 'beginner'], skillLevel: 'beginner' as const, isLocal: false },
    { type: 'mentor' as const, title: 'Find a Lagos Design Mentor', tags: ['design', 'nigeria'], skillLevel: 'beginner' as const, isLocal: true },
    { type: 'resource' as const, title: 'Design Nigeria Slack', tags: ['community', 'nigeria'], isLocal: true },
  ];

  for (const rec of recommendations) {
    await db.recommendation.create({ data: rec });
  }

  console.log('✅ Seed complete');
}

main().catch(console.error).finally(() => db.$disconnect());
```

```bash
# Run seed
npx prisma db seed

# package.json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

---

## Index Strategy

Indexes defined in schema above. Rationale:

| Index | Why |
|---|---|
| `users(email)` | Login lookup |
| `users(status)` | Cron jobs filtering by user state (churn-risk, inactive) |
| `users(deletedAt)` | Filter soft-deleted users from all queries |
| `goals(userId, status)` | Load active goals per user efficiently |
| `checkins(userId, date)` | Dashboard + streak calculation — most frequent query |
| `coach_messages(userId, createdAt)` | Load recent coaching history |
| `payments(flutterwaveTxRef)` | Webhook idempotency check |
| `notification_logs(userId, sentAt)` | Adaptive reminder frequency logic |
| `notification_logs(userId, sentAt, wasDelivered)` | Filter delivered vs undelivered for adaptive logic |
| `refresh_tokens(tokenHash)` | Fast refresh token lookup on every authenticated request |
| `refresh_tokens(expiresAt)` | Cron job to clean expired tokens |
| `password_reset_tokens(tokenHash)` | Fast reset token lookup |
| `password_reset_tokens(expiresAt)` | Cron job to clean expired reset tokens |

---

## Prisma Client Usage Patterns

```ts
// Always filter soft-deleted records
const goals = await db.goal.findMany({
  where: { userId, deletedAt: null, status: 'active' },
  orderBy: { createdAt: 'desc' },
});

// Use transactions for multi-table writes (e.g. check-in + streak update)
await db.$transaction(async (tx) => {
  const checkin = await tx.checkin.create({ data: checkinData });
  await tx.streak.update({ where: { userId }, data: streakData });
  return checkin;
});

// Select only needed fields — never fetch passwordHash in app queries
const user = await db.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, status: true, timezone: true },
});

// Pagination helper for list endpoints
async function paginate<T>(
  model: { findMany: (args: any) => Promise<T[]>; count: (args: any) => Promise<number> },
  where: Record<string, unknown>,
  page: number,
  limit: number
) {
  const [data, total] = await Promise.all([
    model.findMany({ where, skip: (page - 1) * limit, take: limit }),
    model.count({ where }),
  ]);
  return { data, total, page, limit };
}
```

---

## Environment Checklist Before Running Migrations

```bash
# Verify DATABASE_URL is pointing to correct environment
echo $DATABASE_URL

# Check pending migrations before deploying
npx prisma migrate status

# Always back up production before a destructive migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Confirm Prisma client is regenerated after schema changes
npx prisma generate

# For shared dev databases, set shadowDatabaseUrl in prisma/schema.prisma:
# datasource db { ... shadowDatabaseUrl = env("SHADOW_DATABASE_URL") }
```

---

## Cross-References

| File / Resource | Why |
|---|---|
| `architecture.md` | DB design principles (UUIDs, timestamps, soft delete, indexes), connection pooling, env vars |
| `security.md` | Data encryption (notes at app layer), GDPR/NDPR consent storage, PII handling |
| `code-style.md` | Naming conventions (snake_case via @map), testing patterns for DB queries |
| `AGENTS.md` | Canonical data schemas (section 4), user state machine (section 5), analytics events (section 8) |
| `auth-system-builder` skill | RefreshToken + PasswordResetToken tables for auth flows |
| `api-route-scaffolder` skill | OnboardingData JSON column for step persistence, route patterns |
| `ai-plan-generator` skill | Token tracking columns on CoachMessage for cost management |
| `progress-tracker` skill | Streak update logic (calls `db.streak.upsert`) |
