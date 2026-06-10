---
trigger: always_on
---

# security.md — Momentum Security Rules

Load this file when: working on authentication, payments, API design, data handling, user-facing forms, or any code that touches PII.

---

## Authentication

### JWT Strategy
- Access tokens: **15-minute expiry**
- Refresh tokens: **7-day expiry**, stored in `httpOnly` cookie (web) or secure keychain (mobile)
- Rotate refresh tokens on every use — invalidate old token immediately
- Store JWT secret in environment variable — never hardcode
- Use `HS256` minimum, prefer `RS256` for production
- Invalidate all sessions on **password change** and **email change**
- Provide "sign out all devices" functionality in settings
- Store only `user_id` and `role` in JWT payload — never sensitive data

### Password Rules
- Minimum 8 characters, at least 1 number + 1 special character
- Hash with **bcrypt**, cost factor 12
- Never log passwords, tokens, or raw user input

### Rate Limiting (Auth Endpoints)
```ts
POST /auth/login:           5 req / 15min per IP
POST /auth/signup:          3 req / 15min per IP    // prevents account enumeration
POST /auth/forgot-password: 3 req / 15min per IP    // prevents email bombing
POST /auth/refresh:         10 req / 15min per IP
```

### Mobile Session Management
- **Idle timeout**: auto-logout after 7 days of inactivity on mobile (reset on app open if authenticated)
- **Biometric auth** (optional): support Face ID / fingerprint as secondary unlock — never as sole auth factor
- Secure storage: Keychain (iOS) / Keystore (Android) — never AsyncStorage for tokens

---

## API Security

### Request Validation
- Validate **all** incoming request bodies with Zod before processing
- Reject requests with unknown/extra fields (`strict()` in Zod schemas)
- Sanitize all string inputs — strip HTML, trim whitespace
- Set maximum input lengths: notes ≤ 1000 chars, names ≤ 100 chars

### Rate Limiting (General)
Apply to all routes via middleware:

```
AI coach endpoint:  20 req / hour per user
Check-in submit:    3 req / day per user (prevent duplicates)
Payments:           10 req / hour per user
General API:        100 req / 15min per user
```

### Headers
All API responses must include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

Use `helmet` middleware (Express) to set these automatically.

### CORS
- Whitelist only known frontend origins
- Never use `origin: '*'` in production
- Credentials: only for same-origin or explicitly whitelisted domains

### File Upload Security
- Accept only allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 5 MB
- Scan with virus scanner if feasible (defer to Cloudinary's built-in moderation for MVP)
- Never store files on application server — upload directly to Cloudinary or Supabase Storage via signed URLs
- Generate unique filenames server-side — never trust user-provided filenames

### Audit Logging
Log the following events with timestamp, IP address, user agent, and user ID:

```
User signup / login / logout
Password change / email change
Account deletion
Payment initiation / verification / failure
Subscription changes
Data export requests
Admin actions
```

- Logs must not contain passwords, tokens, PII, or payment card data
- Store logs in a separate read-only data store (e.g., `audit_logs` table, log aggregation service)
- Retain logs for minimum 12 months (NDPR requirement)

---

## Payment Security (Flutterwave)

Momentum uses **Flutterwave exclusively** for all payment processing. Paystack is not used.

### Implementation Rules
- **Never store** card numbers, CVVs, or raw payment data — ever
- Use Flutterwave's hosted payment modal (inline JS) — do not build custom card forms
- All payment initiations must be server-side — never expose secret key to frontend
- Verify every payment server-side via Flutterwave's verification endpoint before unlocking premium features

### Webhook Handling
```ts
// Always verify webhook signature
const hash = crypto
  .createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (hash !== req.headers['verif-hash']) {
  return res.status(401).json({ error: 'Invalid webhook signature' });
}
```

- Idempotency: store processed `transaction_id` values and reject duplicates
- Only update subscription status after verified `charge.completed` event
- Log all payment events (without card data) for audit trail

### Keys Management
```
FLUTTERWAVE_PUBLIC_KEY      → frontend only (safe to expose)
FLUTTERWAVE_SECRET_KEY      → backend only, never in client code
FLUTTERWAVE_ENCRYPTION_KEY  → backend only, for payload encryption
```

### Key Rotation
- Rotate Flutterwave secret and encryption keys every 90 days
- Rotate JWT signing keys every 30 days
- Rotate FCM server key on staff change or suspected compromise
- Maintain a key rotation runbook in `/ops/`

---

## Push Notification Security (FCM)

- Store FCM server key in environment variable — never in client code or git history
- Device tokens: store encrypted at rest in the database, scoped to user ID
- Never send PII or payment data in push notification payloads — push payloads are visible in device notification history
- Rate limit push sends: max 2 per user per day (enforced at scheduler level per `architecture.md`)
- Invalidate device tokens on app uninstall (detect via FCM response: `NotRegistered` error)

---

## Data Privacy & Compliance

### GDPR-Style Requirements (Mandatory for MVP)
1. **Consent at onboarding**: explicit checkbox, plain-language copy, record timestamp + version
2. **Data access**: user can request export of all their data (`GET /api/account/export`)
3. **Right to deletion**: user can delete account and all associated data (`DELETE /api/account`)
   - Soft-delete first (`deleted_at` timestamp)
   - Hard-delete via background job after 30-day grace period
   - Anonymise analytics events — do not delete (replace PII with `[deleted_user]`)
4. **Data minimisation**: only collect what is necessary for the product to function

### NDPR (Nigeria Data Protection Regulation)
Momentum operates in Nigeria — NDPR applies alongside GDPR.

- **Data controller**: identify and document who controls user data
- **Lawful basis**: consent (recorded at onboarding) and contract performance (service delivery)
- **Data breach notification**: notify Nigeria's NDPC (National Data Protection Commission) within 72 hours of discovery (per NDPR 2022)
- **Data Protection Officer (DPO)**: designate and publish a DPO contact — users can reach out for privacy concerns
- **Cross-border transfer**: ensure Flutterwave (processing in Nigeria) and Cloudinary/Supabase (data storage locations) comply with NDPR adequacy requirements
- **Retention period**: retain active user data for duration of account + 12 months post-closure; analytics data retained indefinitely (anonymised)

### PII Handling
- Fields classified as PII: `name`, `email`, `phone`, `timezone`, `notes`
- Never log PII to application logs
- Never include PII in error messages sent to Sentry or other monitoring
- Mask PII in admin interfaces: show `T***ay` not `Teejay`

---

## Data Encryption

- **At rest**: encrypt the database volume (Supabase / RDS encryption enabled)
- **In transit**: TLS 1.2+ required — reject older protocols
- **Sensitive fields**: encrypt `notes` at the application layer before storing (AES-256-GCM)
- **Backups**: backups must be encrypted with the same standard

```ts
// Application-layer encryption for sensitive fields (notes)
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { encrypted, iv: iv.toString('hex'), tag };
}

export function decrypt(data: { encrypted: string; iv: string; tag: string }): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(data.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## AI Coaching Security

- Never include other users' data in coaching prompts
- Strip PII from AI responses before logging
- Rate limit Claude API calls per user (see rate limiting section)
- Do not allow users to inject system prompt overrides via check-in notes
- Sanitize all user input before appending to Claude system prompt

```ts
// Sanitize notes before including in AI prompt
const safeNotes = notes
  .replace(/<[^>]*>/g, '')          // strip HTML
  .replace(/[`${}\\]/g, '')         // strip template injection chars
  .substring(0, 500);               // hard cap
```

---

## Mobile Security (React Native)

- Store tokens in **Keychain (iOS) / Keystore (Android)** — never AsyncStorage for sensitive data
- Certificate pinning for production API calls
- Disable screenshot on sensitive screens (payment, account data)
- Obfuscate release builds (Hermes + ProGuard/R8)
- No sensitive data in `console.log` — strip all logs in production builds
- Auto-logout after 7 days of inactivity (see Authentication section)

---

## Environment Variable Security

- Use `.env.example` with placeholder values committed to git — never commit a real `.env` file
- Add `.env` to `.gitignore` — enforce via pre-commit hook
- Production secrets: use the platform's secrets manager (Railway secrets / Vercel environment variables / GitHub Actions secrets)
- Never log env vars during startup or error handling
- Validate all required env vars at application boot:

```ts
// lib/env.ts — fail fast on missing secrets
const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ANTHROPIC_API_KEY',
  'FLUTTERWAVE_SECRET_KEY',
  'FLUTTERWAVE_ENCRYPTION_KEY',
  'FCM_SERVER_KEY',
] as const;

for (const key of REQUIRED) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

---

## CI/CD Security

- Run `npm audit` in CI — fail build on high/critical vulnerabilities
- Run **CodeQL** or equivalent SAST (Static Application Security Testing) on every PR
- Scan commits for secrets with `talisman` or `git-secrets` pre-commit hook
- Pin major versions in `package.json` — no `*` or `latest`
- Review changelogs before upgrading Flutterwave SDK or auth libraries
- Do not install packages with fewer than 1000 weekly downloads without review
- Schedule a **penetration test** before every major release (MVP launch, Premium launch, B2B launch)

---

## CSRF Protection

Refresh tokens stored in `httpOnly` cookies (web) are vulnerable to CSRF. Mitigate with:

1. **SameSite=Strict** attribute on the refresh-token cookie — prevents cross-site form submissions
2. **Origin/Referrer header validation** in the `/api/auth/refresh` handler — reject requests with unexpected `Origin` or `Referer` headers
3. For extra safety: implement the **double-submit cookie pattern** — set a non-`httpOnly` random CSRF token cookie on login, require it as a custom header (`X-CSRF-Token`) on state-changing requests

Mobile clients (React Native) are not vulnerable to CSRF; use the same cookie configuration for codebase consistency but skip header validation.

---

## Security Contact & Ownership

- **Report vulnerabilities**: email `security@momentum.app` or file a private issue in the repo
- **DPO contact**: `dpo@momentum.app` — for NDPR/GDPR data subject requests
- **SLA**: acknowledge within 24 hours, patch critical vulnerabilities within 72 hours

---

## Incident Response Checklist

If a security incident is suspected:
1. Rotate all secrets (JWT, Flutterwave keys, DB password, FCM server key) immediately
2. Invalidate all active sessions
3. Review access logs for affected time window
4. Notify affected users within 72 hours if PII was involved
5. Notify NDPC (Nigeria) within 72 hours if NDPR applies
6. Document the incident and remediation in a post-mortem

---

## Cross-References

| File / Resource | Why |
|---|---|
| `architecture.md` | Route structure, notification architecture, env vars list, error handling |
| `code-style.md` | Code conventions, error handling patterns, testing standards |
| `design-system.md` | UI component rules, form design, empty/loading/error states |
| `AGENTS.md` | Product identity, user state machine, monetisation tiers, analytics events |
| `flutterwave-integration` skill | Full payment flow, webhook implementation, premium unlock logic |
| `auth-system-builder` skill | Signup/login flow, session management, onboarding |
