---
#name: auth-system-builder
#description: Builds complete authentication flows for Momentum — signup, login, JWT session management, onboarding collection, and protected route middleware. Use this skill when scaffolding or modifying anything related to user identity, access control, or the onboarding funnel.
---

## What This Skill Does

Generates the full auth layer for Momentum: registration, login, session management, and the 7-step onboarding flow that collects the data needed to personalise the AI coach from day one.

## When to Load

- Building signup / login screens or API routes
- Implementing JWT access + refresh token logic
- Building the onboarding wizard (post-signup)
- Adding protected route middleware
- Implementing "forgot password" or "change password"
- Building social auth (Google OAuth — future)

---

## Rate Limiting (Auth Endpoints)

Apply these limits per `security.md`:

```
POST /auth/signup:          3 req / 15min per IP
POST /auth/login:           5 req / 15min per IP
POST /auth/forgot-password: 3 req / 15min per IP
POST /auth/refresh:         10 req / 15min per IP
```

---

## Onboarding Data to Collect

This is required for the AI coach to function. Collect in order, one question per screen:

```
Step 1: Name            → "What should I call you?"
Step 2: Primary goal    → "What are you working toward?" (free text + suggested examples)
Step 3: Skill level     → "How would you rate yourself in this area?" (Beginner / Intermediate / Advanced)
Step 4: Learning style  → "How do you learn best?" (Video / Reading / Practice / Mixed)
Step 5: Daily time      → "How much time can you commit daily?" (15 / 30 / 45 / 60+ mins)
Step 6: Reminder time   → "When should I check in with you?" (time picker)
Step 7: Consent         → GDPR/NDPR consent checkbox: "I agree to Momentum's Privacy Policy and Terms of Service."
```

Step 7 is legally mandatory for MVP (see `AGENTS.md` section 11 and `design-system.md` Onboarding section).

Store progress after each step in a JSON column (`onboarding_data`) on the User table — support resuming interrupted onboarding. Each `PATCH /step` overwrites its own key, making the endpoint naturally idempotent.

---

## API Routes to Scaffold

```
POST /api/auth/signup           → create user, return tokens (rate-limited: 3/15min)
POST /api/auth/login            → verify credentials, return tokens (rate-limited: 5/15min)
POST /api/auth/refresh          → rotate refresh token, return new access token
POST /api/auth/logout           → invalidate refresh token
POST /api/auth/forgot-password  → send reset email (rate-limited: 3/15min)
POST /api/auth/reset-password   → verify token, update password
POST /api/auth/social           → social auth (Google OAuth — post-MVP)

PATCH /api/account/password     → change password (requires current password + invalidates all sessions)
PATCH /api/account/email        → change email (requires password + invalidates all sessions)

PATCH /api/onboarding/step      → save one onboarding step
GET  /api/onboarding/status     → return current step + completion %
POST /api/onboarding/complete   → mark onboarding done, set user.state = 'active', trigger first AI coaching message
```

### Social Auth Reservation (post-MVP)

When implementing Google OAuth, reuse the same token pair pattern:

```
POST /api/auth/social
Body: { provider: 'google', idToken: '...' }
→ Look up or create user by provider_id
→ Return same { user, accessToken } shape as signup
→ rate-limited: 10 req / 15min per IP
```

---

## Refresh Token Storage

Store refresh tokens in a dedicated `refresh_tokens` table (not in Redis — they must survive cache flushes):

```ts
// Model: RefreshToken { id, userId, tokenHash, expiresAt, createdAt }
// Index on tokenHash for fast lookup
// TTL: 7 days (matching JWT expiry), cleaned by cron job
```

```ts
// lib/auth/tokens.ts
import crypto from 'node:crypto';

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  await db.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function findRefreshToken(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return db.refreshToken.findUnique({ where: { tokenHash } });
}

export async function deleteRefreshToken(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function deleteAllUserRefreshTokens(userId: string) {
  await db.refreshToken.deleteMany({ where: { userId } });
}
```

---

## JWT Utilities

```ts
// lib/auth/tokens.ts (continued)

export function generateTokenPair(userId: string, role = 'user') {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as JWTPayload;
}
```

---

## Signup Implementation

```ts
// POST /api/auth/signup — rate-limited: 3 req / 15min per IP
const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[0-9]/).regex(/[^a-zA-Z0-9]/),
  name: z.string().min(2).max(100),
  consentAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms to create an account.',
  }),
});

async function signup(req, res) {
  const { email, password, name } = SignupSchema.parse(req.body);

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new AppError('EMAIL_TAKEN', 'Email already registered.', 409);

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      status: 'onboarding',
      consentAcceptedAt: new Date(),
      consentVersion: '1.0',
    },
  });

  const { accessToken, refreshToken } = generateTokenPair(user.id);
  await storeRefreshToken(user.id, refreshToken);

  await analytics.track('user_signed_up', { userId: user.id });

  res.status(201).json({
    success: true,
    data: { user: sanitizeUser(user), accessToken },
    // refreshToken set as httpOnly cookie with SameSite=Strict
  });
}
```

### Email Verification (MVP Note)

Signup creates the user immediately without email verification — intentional for MVP velocity. The user's email is considered verified after they complete onboarding and submit their first check-in. Post-MVP, add a verification step between signup and onboarding that sends a 6-digit code.

---

## Login Implementation

```ts
// POST /api/auth/login — rate-limited: 5 req / 15min per IP
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

async function login(req, res) {
  const { email, password } = LoginSchema.parse(req.body);

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);

  const { accessToken, refreshToken } = generateTokenPair(user.id);
  await storeRefreshToken(user.id, refreshToken);

  await analytics.track('user_logged_in', { userId: user.id });

  res.json({
    success: true,
    data: { user: sanitizeUser(user), accessToken },
  });
}
```

---

## Refresh Token Rotation

```ts
// POST /api/auth/refresh — rate-limited: 10 req / 15min per IP
async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) throw new AuthError('No refresh token provided');

  // Verify JWT signature
  let payload: JWTPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }

  // Verify token exists in DB (not revoked)
  const stored = await findRefreshToken(token);
  if (!stored) throw new AuthError('Refresh token has been revoked');

  // Rotate: delete old, issue new
  await deleteRefreshToken(token);

  const { accessToken: newAccess, refreshToken: newRefresh } = generateTokenPair(payload.userId);
  await storeRefreshToken(payload.userId, newRefresh);

  res.json({
    success: true,
    data: { accessToken: newAccess },
  });
}
```

---

## Logout Implementation

```ts
// POST /api/auth/logout
async function logout(req, res) {
  const token = req.cookies.refreshToken;
  if (token) {
    await deleteRefreshToken(token);
  }

  res.clearCookie('refreshToken');
  res.json({ success: true, data: null, error: null });
}

// POST /api/auth/logout-all — sign out of all devices
async function logoutAll(req, res) {
  await deleteAllUserRefreshTokens(req.user.id);
  res.clearCookie('refreshToken');
  res.json({ success: true, data: null, error: null });
}
```

---

## Forgot / Reset Password

```ts
// POST /api/auth/forgot-password — rate-limited: 3 req / 15min per IP
async function forgotPassword(req, res) {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const user = await db.user.findUnique({ where: { email } });
  // Always return success — prevents email enumeration
  if (!user) return res.json({ success: true, data: { message: 'If the email exists, a reset link has been sent.' } });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: resetHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendEmail({
    to: user.email,
    subject: 'Reset your Momentum password',
    body: `Reset link: https://momentum.app/auth/reset-password?token=${resetToken}`,
  });

  res.json({ success: true, data: { message: 'If the email exists, a reset link has been sent.' } });
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  const { token, password } = z.object({
    token: z.string().min(32),
    password: z.string().min(8).regex(/[0-9]/).regex(/[^a-zA-Z0-9]/),
  }).parse(req.body);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const stored = await db.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('INVALID_RESET_TOKEN', 'Reset token is invalid or expired.', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await db.$transaction([
    db.user.update({ where: { id: stored.userId }, data: { password: hashedPassword } }),
    db.passwordResetToken.delete({ where: { tokenHash } }),
    db.refreshToken.deleteMany({ where: { userId: stored.userId } }), // invalidate all sessions
  ]);

  res.json({ success: true, data: { message: 'Password updated. Please sign in with your new password.' } });
}
```

---

## Change Password / Email (with Session Invalidation)

```ts
// PATCH /api/account/password — requires current password, invalidates all sessions
async function changePassword(req, res) {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8).regex(/[0-9]/).regex(/[^a-zA-Z0-9]/),
  }).parse(req.body);

  const user = await db.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('INVALID_PASSWORD', 'Current password is incorrect.', 401);

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { password: hashed } }),
    db.refreshToken.deleteMany({ where: { userId: user.id } }), // sign out all devices
  ]);

  await analytics.track('password_changed', { userId: user.id });

  res.json({ success: true, data: { message: 'Password updated. Please sign in again.' } });
}

// PATCH /api/account/email — requires password, invalidates all sessions
async function changeEmail(req, res) {
  const { password, newEmail } = z.object({
    password: z.string(),
    newEmail: z.string().email(),
  }).parse(req.body);

  const user = await db.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('INVALID_PASSWORD', 'Password is incorrect.', 401);

  const existing = await db.user.findUnique({ where: { email: newEmail } });
  if (existing) throw new AppError('EMAIL_TAKEN', 'Email already in use.', 409);

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { email: newEmail } }),
    db.refreshToken.deleteMany({ where: { userId: user.id } }), // sign out all devices
  ]);

  await analytics.track('email_changed', { userId: user.id });

  res.json({ success: true, data: { message: 'Email updated. Please sign in with your new email.' } });
}
```

---

## Auth Middleware

```ts
// middleware/requireAuth.ts
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('No token provided');
  }

  const token = authHeader.split(' ')[1];
  let payload: JWTPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AuthError('Invalid or expired access token');
  }

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.deletedAt) {
    throw new AuthError('User not found or deactivated');
  }

  req.user = sanitizeUser(user);
  req.user.role = payload.role ?? 'user';
  req.user.subscriptionTier = user.subscriptionTier ?? 'free';
  next();
}
```

Key differences from the raw `findUniqueOrThrow` pattern:
- Catches JWT verification errors explicitly → `AuthError` (401), not a 500
- Returns `AuthError` if user was deleted mid-session
- Attaches `role` and `subscriptionTier` to `req.user` for downstream middleware

---

## User States (Full Lifecycle)

Map to the 7 states defined in `AGENTS.md` section 5:

```
signup                      → user.state = 'onboarding'
onboarding complete         → user.state = 'active'
2+ consecutive days missed  → user.state = 'streak-broken'  (cron, see progress-tracker)
user responds to recovery   → user.state = 'recovering'
milestone reached           → user.state = 'milestone-reached'  (transient, reverts after 24h)
14 days no check-in         → user.state = 'inactive'  (cron)
21+ days no check-in        → user.state = 'churn-risk'  (cron)
account deleted             → soft-delete with deleted_at timestamp
```

Store the state on the User model as `state` enum. Use it in `requireAuth` to block access for deleted or churn-risk users from writing endpoints (read-only is fine).

---

## Onboarding Screen Structure (React Native / Next.js)

```tsx
// Multi-step wizard with progress indicator

const ONBOARDING_STEPS = [
  { id: 'name',           question: "What should I call you?",                  type: 'text' },
  { id: 'goal',           question: "What are you working toward?",             type: 'text-with-suggestions' },
  { id: 'skill_level',    question: "How would you rate yourself?",             type: 'single-choice' },
  { id: 'learning_style', question: "How do you learn best?",                   type: 'single-choice' },
  { id: 'daily_time',     question: "How much time can you commit daily?",      type: 'single-choice' },
  { id: 'reminder_time',  question: "When should I check in with you?",         type: 'time-picker' },
  { id: 'consent',        question: "I agree to the Privacy Policy and Terms.", type: 'checkbox' },
];

// Progress: show step X of 7, with animated progress bar
// Back button: always visible after step 1
// Skip: not available — all fields are required for AI personalisation
// Each step saved immediately to /api/onboarding/step (allows resume)
// Consent step: checkbox + link to /privacy and /terms
// Step 7 completion calls POST /api/onboarding/complete
```

---

## Protected Routes (Frontend)

```ts
// React: redirect to /auth/login if no valid session
// React Native: redirect to Auth stack if no stored token

function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isLoading]);

  return { user, isLoading };
}
```

---

## Security Notes

- See `security.md` (`.agent/rules/security.md`) for full token storage, password hashing, and PII requirements
- Never return password hash in any API response
- `sanitizeUser()` must strip: `password`, `refreshTokenHash`, `deletedAt`, `onboardingData` before sending to client
- Rate limit all auth endpoints (see table at top of this file)
- Always return the same message for "email not found" on forgot-password to prevent email enumeration
- Consent timestamp and version must be recorded per `security.md` (GDPR/NDPR requirement)
- Password/email change invalidates all existing sessions (deletes all refresh tokens)

---

## Cross-References

| File / Resource | Why |
|---|---|
| `security.md` | JWT strategy, password hashing, rate limiting, PII handling, GDPR/NDPR consent, session invalidation |
| `code-style.md` | API route conventions, error handling patterns, testing standards |
| `design-system.md` | Onboarding step UI, progress indicator, consent checkbox, empty/error states |
| `AGENTS.md` | User state machine (section 5), analytics events (section 8), notification rules (section 6) |
| `api-route-scaffolder` skill | Full route inventory, middleware patterns, error codes |
| `component-builder` skill | Onboarding screen components, form inputs, progress bar |
| `screen-builder` skill | Onboarding wizard screen template, auth screens |
