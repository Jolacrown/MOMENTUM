---
#name: flutterwave-integration

#description: Handles all Flutterwave API connections, payment flows, subscription management, webhook verification, and premium unlock logic for Momentum. Use this skill for any task involving payments, billing, plan upgrades, or transaction verification. Paystack is NOT used — Flutterwave is the only payment provider.

---

## What This Skill Does

Implements the complete Flutterwave payment layer for Momentum — from OAuth token management to charge initiation, webhook processing, and premium feature unlocking. Every payment interaction in the app routes through this layer.

## When to Load

- Building the `/api/payments/*` routes
- Implementing the Premium upgrade screen or flow
- Setting up or modifying the webhook handler
- Managing subscription status or billing cycles
- Processing refunds or handling failed charges
- Any screen or flow that gates features behind payment

---

## 1. Environments & Base URLs

Flutterwave uses **two environments**. Always route via environment variable — never hardcode URLs.

```ts
// lib/flutterwave/config.ts

const isProd = process.env.NODE_ENV === 'production';

export const FLW_BASE_URL = isProd
  ? 'https://f4bexperience.flutterwave.com'
  : 'https://developersandbox-api.flutterwave.com';

export const FLW_TOKEN_URL =
  'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';
```

### Required Environment Variables

```env
# Sandbox
FLW_SANDBOX_CLIENT_ID=
FLW_SANDBOX_CLIENT_SECRET=

# Production
FLW_PROD_CLIENT_ID=
FLW_PROD_SECRET_KEY=

# Webhook — set this in Flutterwave dashboard under Settings > Webhooks
FLW_SECRET_HASH=

NODE_ENV=development     ← change to 'production' for live
```

**Security rule**: All of the above are backend-only. Never expose `CLIENT_SECRET` or `SECRET_KEY` to frontend code, React Native bundles, or client-side API calls.

---

## 2. Authentication — OAuth 2.0 Token Management

Flutterwave uses **OAuth 2.0 client credentials**. Access tokens expire in **10 minutes**. Refresh 60 seconds before expiry.

```ts
// lib/flutterwave/tokenManager.ts

interface TokenState {
  accessToken: string | null;
  expiresAt: number; // Unix ms
}

const state: TokenState = { accessToken: null, expiresAt: 0 };

async function fetchNewToken(): Promise<void> {
  const response = await fetch(FLW_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.FLW_PROD_CLIENT_ID!,
      client_secret: process.env.FLW_PROD_SECRET_KEY!,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) throw new Error(`Token fetch failed: ${response.status}`);

  const data = await response.json();
  state.accessToken = data.access_token;
  // Subtract 60s buffer so we refresh before actual expiry
  state.expiresAt = Date.now() + (data.expires_in - 60) * 1000;
}

export async function getAccessToken(): Promise<string> {
  if (!state.accessToken || Date.now() >= state.expiresAt) {
    await fetchNewToken();
  }
  return state.accessToken!;
}
```

**Use `getAccessToken()` before every Flutterwave API call.** Never cache tokens in the client.

---

## 3. Core API Client

```ts
// lib/flutterwave/client.ts

import { v4 as uuidv4 } from 'uuid';
import { FLW_BASE_URL, getAccessToken } from './config';

export async function flwRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH',
  path: string,
  body?: object
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Trace-Id': uuidv4(), // unique per request for traceability
  };

  // All POST requests must include an idempotency key
  if (method === 'POST') {
    headers['X-Idempotency-Key'] = uuidv4();
  }

  const response = await fetch(`${FLW_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new FlutterwaveError(error.message || 'Flutterwave API error', response.status, error);
  }

  return response.json() as T;
}
```

---

## 4. Payment Flow for Momentum Premium

Momentum uses Flutterwave to charge users (in NGN) for Premium plan upgrades.

### Step 1 — Create Customer (on first payment attempt)

```ts
// lib/flutterwave/customers.ts

export async function createFlutterwaveCustomer(user: {
  email: string;
  name: string;
  phone?: string;
}) {
  return flwRequest('POST', '/customers', {
    email: user.email,
    name: { first: user.name.split(' ')[0], last: user.name.split(' ').slice(1).join(' ') },
    phone: user.phone ? { country_code: '234', number: user.phone } : undefined,
  });
}

// Store returned `data.id` as `flwCustomerId` on the User record (see §Schema below)
// Check for existing flwCustomerId before creating — never create duplicates
```

### Step 2 — Create Payment Method

```ts
// Card (encrypted via Flutterwave JS SDK — never handle raw card data)
export async function createCardPaymentMethod(nonce: string, encryptedCard: {
  encrypted_card_number: string;
  encrypted_expiry_month: string;
  encrypted_expiry_year: string;
  encrypted_cvv: string;
}) {
  return flwRequest('POST', '/payment-methods', {
    type: 'card',
    card: { nonce, ...encryptedCard },
  });
}

// Mobile Money (most common for Nigerian users)
export async function createMobileMoneyPaymentMethod(phone: string, network: string) {
  return flwRequest('POST', '/payment-methods', {
    type: 'mobile_money',
    mobile_money: { country_code: '234', network, phone_number: phone },
  });
}
```

> **Important**: Card data must be encrypted using the Flutterwave JS SDK before reaching your server. Never accept raw PAN, CVV, or expiry directly from your app.

### Step 3 — Initiate Charge

```ts
// lib/flutterwave/charges.ts

export async function initiateCharge(params: {
  customerId: string;
  paymentMethodId: string;
  amountKobo: number;        // NGN * 100 (stored as Int in DB)
  reference: string;         // your internal flutterwaveTxRef — store before calling
  redirectUrl: string;
  metadata?: Record<string, string>;
}) {
  return flwRequest('POST', '/charges', {
    reference: params.reference,
    currency: 'NGN',
    customer_id: params.customerId,
    payment_method_id: params.paymentMethodId,
    redirect_url: params.redirectUrl,
    amount: params.amountKobo,
    meta: params.metadata,
  });
}
```

**Always generate and store `reference` in the `payments` table as `flutterwaveTxRef` before calling Flutterwave**, so you can reconcile even if the API call drops.

### Step 4 — Handle `next_action`

After initiating a charge, inspect `data.next_action.type`:

```ts
switch (nextAction.type) {
  case 'redirect_url':
    // Redirect user to nextAction.redirect_url.url (3DS or mobile money)
    // Payment completes asynchronously — listen on webhook
    break;

  case 'requires_pin':
    // Show PIN entry UI → collect encrypted PIN → PATCH /charges/:id
    break;

  case 'requires_otp':
    // Show OTP entry UI → collect code → PATCH /charges/:id
    break;

  case 'requires_additional_fields':
    // Show billing address form → PATCH /charges/:id with AVS data
    break;

  case 'payment_instruction':
    // Show user the instruction text (e.g. USSD or bank transfer instructions)
    // Poll or wait for webhook
    break;
}
```

### Step 5 — Verify Charge

**Always verify before unlocking Premium.** Do not trust the charge initiation response alone.

```ts
// lib/flutterwave/verify.ts

export async function verifyCharge(chargeId: string) {
  // Flutterwave v4 verify endpoint: GET /charges/:reference/verify
  const result = await flwRequest<FlwChargeResponse>('GET', `/charges/${chargeId}/verify`);

  return {
    isSuccessful:
      result.data.status === 'succeeded' &&
      result.data.currency === 'NGN',
    amountKobo: result.data.amount,
    reference: result.data.reference,
    status: result.data.status,
  };
}
```

---

## 5. Momentum Pricing (NGN)

```ts
// lib/flutterwave/plans.ts

export const MOMENTUM_PLANS = {
  premium_monthly: {
    amountKobo: 2500_00,       // NGN 2,500 = 250,000 kobo
    label: 'Premium Monthly',
    interval: 'monthly',
  },
  premium_annual: {
    amountKobo: 24000_00,      // NGN 24,000 = 2,400,000 kobo
    label: 'Premium Annual',
    interval: 'yearly',
    savingsLabel: 'Save 20%',
  },
} as const;
```

All amounts stored in **kobo** (NGN × 100) as `Int` in the `payments` table. Display as `(amount / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })`.

---

## 6. Momentum API Routes (Backend)

Scaffold these routes in `src/features/payments/`:

```
POST  /api/payments/initiate
      Body: { planId, paymentMethodType, phone? }
      Auth: requireAuth middleware
      Rate limit: 10 req / hour per user (see security.md)
      → Creates FLW customer if needed (check user.flwCustomerId)
      → Creates payment method
      → Initiates charge
      → Returns { chargeId, nextAction, flutterwaveTxRef }

GET   /api/payments/verify/:chargeId
      Auth: requireAuth middleware
      Rate limit: 10 req / hour per user
      → Calls FLW verify endpoint
      → If succeeded: updates user.subscriptionTier = 'premium', sets periodStart/periodEnd
      → Returns { success, plan, expiresAt }

POST  /api/payments/webhook
      Auth: NONE (public — verified via signature header)
      No rate limit (Flutterwave calls this, not users)
      → Verifies FLW_SECRET_HASH signature
      → Processes charge.completed event
      → Idempotency check via webhook_events table
      → Unlocks premium or flags failed payment

POST  /api/payments/refund
      Auth: requireAuth + requireAdmin
      Body: { paymentId, reason }
      Rate limit: 5 req / hour per admin
      → Creates refund via FLW /refunds endpoint
      → Updates payment status to 'refunded'
      → Downgrades user to 'free'

POST  /api/payments/cancel
      Auth: requireAuth + requirePremium
      → Sets user.subscriptionTier = 'free'
      → Clears periodStart/periodEnd
      → Notifies user their premium ends immediately
      Note: No refund issued for cancellation — only for admin-initiated refunds
```

---

## 7. Rate Limiting

Apply to all payment routes per `security.md`:

```
POST /api/payments/initiate:   10 req / hour per user
GET  /api/payments/verify/:id: 10 req / hour per user
POST /api/payments/refund:     5 req / hour per admin
POST /api/payments/cancel:     3 req / hour per user
POST /api/payments/webhook:    No rate limit (Flutterwave IP-whitelist only)
```

---

## 8. Webhook Handler

Webhooks are the authoritative source for payment status in Momentum. The upgrade flow must be driven by `charge.completed` events, not by the charge initiation response.

```ts
// api/payments/webhook.ts

import crypto from 'crypto';
import express from 'express';
import { logger } from '@/lib/logger';

// CRITICAL: Use raw body parser for webhooks — JSON parsing must happen after signature check
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),   // ← raw buffer, not parsed JSON
  async (req, res) => {
    const signature = req.headers['flutterwave-signature'] as string;
    const secretHash = process.env.FLW_SECRET_HASH!;

    // 1. Verify signature using HMAC-SHA256
    const hash = crypto
      .createHmac('sha256', secretHash)
      .update(req.body)           // raw Buffer
      .digest('base64');

    if (!signature || hash !== signature) {
      logger.error({ message: 'Invalid webhook signature', reqId: req.id });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Parse body now that it's verified
    const payload = JSON.parse(req.body.toString());

    // 3. Respond 200 immediately — do work asynchronously
    res.status(200).end();

    // 4. Idempotency check — skip if already processed
    const webhookId = payload.id;
    const alreadyProcessed = await db.webhookEvent.findUnique({ where: { webhookId } });
    if (alreadyProcessed) return;

    await db.webhookEvent.create({
      data: { webhookId, type: payload.type, processedAt: new Date() }
    });

    // 5. Handle event types
    if (payload.type === 'charge.completed') {
      await handleChargeCompleted(payload.data);
    }
  }
);

async function handleChargeCompleted(data: FlwChargeData) {
  // Always re-verify via API before giving value
  const verified = await verifyCharge(data.id);
  if (!verified.isSuccessful) return;

  // Match to Momentum user via flutterwaveTxRef
  const payment = await db.payment.findUnique({
    where: { flutterwaveTxRef: verified.reference },
  });

  if (!payment) {
    logger.error({ message: `No payment record found for reference: ${verified.reference}` });
    return;
  }

  // Unlock premium
  await db.user.update({
    where: { id: payment.userId },
    data: {
      subscriptionTier: 'premium',
    },
  });

  // Update payment record with period dates
  const plan = MOMENTUM_PLANS[payment.plan as keyof typeof MOMENTUM_PLANS];
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'successful',
      verifiedAt: new Date(),
      periodStart: new Date(),
      periodEnd: calculateExpiry(payment.plan),
    },
  });

  // Track analytics
  await analytics.track('upgrade_completed', {
    userId: payment.userId,
    plan: payment.plan,
    amountKobo: verified.amountKobo,
  });
}
```

### Webhook Event Types to Handle

| Event | Action |
|---|---|
| `charge.completed` | Verify → unlock premium → set period dates |
| `charge.failed` | Update `payment.status = 'failed'` → notify user |
| `refund.completed` | Set `user.subscriptionTier = 'free'`, clear period dates |

### Webhook Event Table Cleanup

Run a monthly cron job to delete `webhook_event` rows older than 90 days:

```sql
DELETE FROM webhook_events WHERE processed_at < NOW() - INTERVAL '90 days';
```

---

## 9. Premium Unlock Logic

```ts
// lib/subscriptions.ts
import { addMonths, addYears, isAfter } from 'date-fns';

export function calculateExpiry(plan: string): Date {
  const now = new Date();
  if (plan === 'premium_monthly') return addMonths(now, 1);
  if (plan === 'premium_annual') return addYears(now, 1);
  throw new Error(`Unknown plan: ${plan}`);
}

// Called from requirePremium middleware — uses req.user, no extra DB query
export function isPremiumActive(user: { subscriptionTier: string; premiumExpiresAt: Date | null }): boolean {
  return (
    user.subscriptionTier === 'premium' &&
    user.premiumExpiresAt !== null &&
    isAfter(new Date(user.premiumExpiresAt), new Date())
  );
}
```

Note: `premiumExpiresAt` is `periodEnd` on the latest successful payment record. Sync it to the User model for fast lookups:

```ts
// When premium is activated, also set on User:
await db.user.update({
  where: { id: payment.userId },
  data: {
    subscriptionTier: 'premium',
    premiumExpiresAt: periodEnd,  // mirror of latest payment.periodEnd
  },
});
```

### Premium Features to Gate (per AGENTS.md §12)

| Feature | Free | Premium |
|---|---|---|
| Active goals | 1 | Unlimited |
| AI coach messages | 5/day | Unlimited |
| Dashboard / streaks | ✅ | ✅ |
| Deep analytics | ❌ | ✅ |
| PDF report export | ❌ | ✅ |
| Mentor matching | ❌ | ✅ |

---

## 10. Refund Implementation

```ts
// POST /api/payments/refund — admin only, rate-limited: 5 req/hour
async function refundPayment(req, res) {
  const { paymentId, reason } = z.object({
    paymentId: z.string().uuid(),
    reason: z.string().min(5).max(500),
  }).parse(req.body);

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError('PAYMENT_NOT_FOUND', 'Payment not found.', 404);
  if (payment.status !== 'successful') throw new AppError('PAYMENT_NOT_REFUNDABLE', 'Only successful payments can be refunded.', 400);

  // Call Flutterwave refund API
  await flwRequest('POST', `/charges/${payment.flutterwaveTxRef}/refund`, {
    reason,
  });

  // Update local records
  await db.$transaction([
    db.payment.update({
      where: { id: paymentId },
      data: { status: 'refunded' },
    }),
    db.user.update({
      where: { id: payment.userId },
      data: {
        subscriptionTier: 'free',
        premiumExpiresAt: null,
      },
    }),
  ]);

  await analytics.track('payment_refunded', {
    paymentId,
    userId: payment.userId,
    amountKobo: payment.amount,
  });

  return ok(res, { message: 'Payment refunded and user downgraded to Free.' });
}
```

---

## 11. Idempotency Rules

- Every `POST` to Flutterwave requires a unique `X-Idempotency-Key` (UUID)
- Generate `flutterwaveTxRef` (your internal reference) **before** calling Flutterwave and store it in the `payments` table first
- Store processed `webhook.id` values in a `webhook_events` table to deduplicate
- Retry charge initiations with the **same** idempotency key on `5xx` errors — safe to do so
- Never retry with a new key on a `4xx` — fix the request first

---

## 12. Error Handling

```ts
// Flutterwave error shape
interface FlwError {
  status: 'error';
  message: string;
  data: null;
}

export class FlutterwaveError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public raw: FlwError
  ) {
    super(message);
    this.name = 'FlutterwaveError';
  }
}
```

### User-Facing Error Messages

| HTTP Status | Internal Cause | Message to User |
|---|---|---|
| 400 | Invalid card/phone | "Payment details are invalid. Please check and try again." |
| 401 | Auth failure | "Something went wrong. Please try again shortly." |
| 422 | Insufficient funds | "Your payment was declined. Please try a different method." |
| 429 | Rate limit | "Too many attempts. Please wait a moment and try again." |
| 5xx | FLW server error | "Payment service is temporarily unavailable. Your card has not been charged." |

Never expose raw Flutterwave error messages to users — always map to friendly copy.

---

## 13. Polling Fallback (Backup for Webhook Failures)

Implement a background job that checks pending payments every hour in case webhooks are missed:

```ts
// jobs/reconcilePayments.ts  (cron: every 1 hour)

export async function reconcilePendingPayments() {
  const pending = await db.payment.findMany({
    where: {
      status: 'pending',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24h only
    },
  });

  for (const payment of pending) {
    try {
      const verified = await verifyCharge(payment.flutterwaveTxRef);
      if (verified.isSuccessful) {
        await handleChargeCompleted({ id: payment.flutterwaveTxRef, reference: payment.flutterwaveTxRef, amount: verified.amountKobo });
      }
    } catch (err) {
      logger.error({ err, context: `reconciliation_failed_for_payment_${payment.id}` });
    }
  }
}
```

---

## 14. Database Schema (Canonical — matches `db-migration-runner`)

```prisma
// Add to prisma/schema.prisma — matches the Payment model in db-migration-runner

model User {
  // ... existing fields ...
  flwCustomerId    String?   @map("flw_customer_id")    // Flutterwave customer ID, cached after first payment
  subscriptionTier String    @default("free") @map("subscription_tier")
  premiumExpiresAt DateTime? @map("premium_expires_at") // mirror of latest payment.periodEnd

  payments          Payment[]
  webhookEvents     WebhookEvent[]
}

model Payment {
  id               String    @id @default(uuid())
  userId           String    @map("user_id")
  flutterwaveTxRef String    @unique @map("flutterwave_tx_ref")  // your internal reference
  flutterwaveTxId  String?   @map("flutterwave_tx_id")           // returned by Flutterwave
  amount           Int                                            // in kobo (NGN * 100)
  currency         String    @default("NGN")
  status           String                                        // "pending" | "successful" | "failed" | "refunded"
  plan             String                                        // "premium_monthly" | "premium_annual"
  periodStart      DateTime? @map("period_start")                 // premium subscription start
  periodEnd        DateTime? @map("period_end")                   // premium subscription expiry
  verifiedAt       DateTime? @map("verified_at")
  createdAt        DateTime  @default(now()) @map("created_at")

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([flutterwaveTxRef])
  @@map("payments")
}

model WebhookEvent {
  id          String   @id @default(uuid())
  webhookId   String   @unique    // FLW webhook event id — for idempotency
  type        String
  processedAt DateTime @default(now())

  @@map("webhook_events")
}
```

---

## 15. Testing Checklist

Before going live, verify all of the following in **sandbox** (`developersandbox-api.flutterwave.com`):

- [ ] Token refresh logic works when token expires (10 min window)
- [ ] Successful card charge → webhook fires → user upgraded to Premium
- [ ] Failed charge → user NOT upgraded, receives failure message
- [ ] Duplicate webhook with same `id` → processed only once
- [ ] Webhook with invalid signature → rejected with 401
- [ ] `flutterwaveTxRef` collision handled (attempt to create duplicate)
- [ ] Hourly reconciliation job picks up a missed webhook
- [ ] Premium expiry date calculated correctly for monthly and annual (using `date-fns`)
- [ ] `isPremiumActive()` returns false after expiry date passes
- [ ] Refund flow tested end-to-end (admin panel → FLW refund → user downgraded)
- [ ] Cancel flow — user downgraded, no refund issued
- [ ] Rate limits enforced on all payment routes
- [ ] `console.log`/`console.error` not used in any payment code — all logs via `logger`

Use Flutterwave's test card numbers and mobile money credentials from the [Testing page](https://developer.flutterwave.com/docs/testing).

---

## Cross-References

| File / Resource | Why |
|---|---|
| `security.md` | Payment security rules, webhook HMAC verification, rate limiting (10 req/hour), PII rules |
| `db-migration-runner` skill | Canonical `Payment` schema, `webhook_events` table, `User.flwCustomerId` field |
| `architecture.md` | Payment route inventory, env vars (FLW keys), async job queue for reconciliation |
| `code-style.md` | Error handling patterns, testing standards (mock Flutterwave), logger conventions |
| `design-system.md` | Premium upgrade UI, PremiumGate component, post-upgrade celebration, NGN display format |
| `AGENTS.md` | Monetisation tiers (section 12), analytics events (section 8), non-negotiable constraints |
| `component-builder` skill | PremiumGate component spec, upgrade screen components |
| `screen-builder` skill | Upgrade screen template, billing history screen |
