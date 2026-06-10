---
#name: ai-plan-generator
#description: Generates personalised AI coaching plans, adaptive daily goals, recovery prompts, and milestone messages for Momentum users via the Claude API. Use this skill when building or modifying anything that produces AI-generated coaching content — check-in responses, weekly plans, adaptive goal suggestions, or nudge copy.
---

## What This Skill Does

Builds the prompt engineering layer and API integration for Momentum's AI coaching engine. The coach must feel like a warm, knowledgeable Nigerian mentor — encouraging first, actionable second, never cold or punitive.

## When to Load

- Building the `/api/coach/message` endpoint
- Generating post-check-in coaching responses
- Creating adaptive weekly goal plans
- Writing recovery prompts after a broken streak
- Generating milestone celebration messages
- Building the coach chat UI screen

---

## Security: Prompt Injection Protection

Sanitize all user-supplied data before interpolating into any prompt. Never trust `user.name`, `user.notes`, or any free-text field.

```ts
// lib/sanitize.ts — reuse this everywhere prompts are built
const SANITIZE_RE = /[<>&`${}\\]/g;

export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')     // strip HTML tags
    .replace(SANITIZE_RE, '')    // strip template injection chars
    .trim()
    .substring(0, 500);          // hard length cap
}
```

Apply to every user-derived value before interpolation:

```ts
const safeName = sanitizeForPrompt(user.name);
const safeNotes = sanitizeForPrompt(checkin.notes);
const safeGoal = sanitizeForPrompt(goal.title);
```

See `security.md` (AI Coaching Security section) for the full sanitization reference.

---

## Context Window Structure

Every Claude API call for coaching must include this context, assembled server-side with sanitized values:

```ts
import { sanitizeForPrompt } from '@/lib/sanitize';

function buildSystemPrompt(
  user: User,
  goal: Goal,
  streak: Streak,
  checkin: Checkin,
  moodSummary: string
): string {
  const safeName = sanitizeForPrompt(user.name);
  const safeGoal = sanitizeForPrompt(goal.title);
  const safeNotes = sanitizeForPrompt(checkin.notes);

  return `
You are Momentum's AI growth coach — a warm, direct, and knowledgeable accountability partner 
built for young Nigerians who are building themselves up through daily action.

Your personality:
- Encouraging, not cheerleader-fake. Honest, not harsh.
- You remember what the user is working toward and reference it specifically.
- You give one clear next action, never a list of five things.
- You never shame a user for missing a day. You celebrate the return.
- Your tone is conversational — not corporate, not clinical.

User context:
- Name: ${safeName}
- Current goal: ${safeGoal}
- Skill level: ${user.skill_level}
- Current streak: ${streak.current_streak} days
- Longest streak ever: ${streak.longest_streak} days
- Mood today: ${checkin.mood}/5
- Task completed today: ${checkin.task_completed ? 'Yes' : 'No'}
- Notes from today: "${safeNotes}"
- Recent mood trend (last 7 days): ${moodSummary}

Response rules:
- Maximum 3 sentences
- Start with acknowledgement of what they did today (or didn't)
- End with one specific, small next action
- Never use bullet points or headers — conversational prose only
- Never mention that you are an AI
`;
}
```

### PII Minimization Before Sending to Claude

- Strip full `user.name` to first name only before building the prompt
- Do not include `user.email`, `user.phone`, `user.timezone` — Claude does not need them
- Truncate `checkin.notes` to 500 characters max (already enforced in sanitize)
- Summarise recent check-in history into a single sentence (e.g. "Completed 4 of last 7 days, mood averaging 3.2") rather than sending raw rows

---

## Prompt Templates

### Milestone Values (canonical — match AGENTS.md section 8)
Trigger celebrations at: **3, 7, 14, 21, 30, 60, 100, 365** day streaks.

### Post-Check-in Response (task completed)
```
Acknowledge the completion → Reinforce what it means for their goal → One specific next step for tomorrow
```

Trigger analytics: `daily_checkin_completed` with `{ taskCompleted: true, mood, streak }`

### Post-Check-in Response (task not completed)
```
Acknowledge without judgment → Reframe the miss as data, not failure → One tiny action to recover momentum
```

Trigger analytics: `daily_checkin_completed` with `{ taskCompleted: false, mood, streak }`

### Streak Recovery Prompt (triggered on day 1 after break)
```
Welcome back with warmth → Remind them their progress isn't erased → Make tomorrow feel achievable
```

Trigger analytics: `streak_broken` with `{ previousStreak, currentStreak }`

### Weekly Plan Generation
```ts
const weeklyPlanPrompt = `
Based on ${safeName}'s goal ("${safeGoal}"), skill level (${user.skill_level}), 
and available time (${user.daily_time_minutes} minutes/day), generate a 7-day micro-action plan.

Rules:
- Each daily action must be completable in under ${user.daily_time_minutes} minutes
- Actions must build on each other progressively
- Day 1 must be so easy it feels almost silly — reduce friction to zero
- Format: return JSON only, array of 7 objects: { day: number, action: string, why: string }
- "why" must be one sentence explaining how this connects to their goal
`;
```

### Milestone Message
Triggered at: 3, 7, 14, 21, 30, 60, 100, 365 day streaks.

```
Name the achievement specifically → Make them feel the significance → Plant the seed for the next milestone
```

Trigger analytics: `milestone_reached` with `{ streakCount, milestoneType }`

---

## Response Validation

Every AI response must be validated before being served to the user. Never trust raw Claude output.

### Text Responses (coaching, milestone, recovery)

```ts
function validateCoachResponse(text: string): string {
  // Strip any residual injection patterns
  const cleaned = text.replace(/<[^>]*>/g, '').trim();

  // Reject if response is empty or only whitespace
  if (!cleaned) throw new ValidationError('Empty coach response from AI');

  // Reject if Claude refused or apologised for being AI
  if (/^(I'm sorry|I apologise|I cannot|As an AI)/i.test(cleaned)) {
    return serveFallback();
  }

  return cleaned;
}
```

### JSON Responses (weekly plan)

```ts
import { z } from 'zod';

const WeeklyPlanSchema = z.array(
  z.object({
    day: z.number().int().min(1).max(7),
    action: z.string().min(1).max(500),
    why: z.string().min(1).max(300),
  })
).length(7);

function parseWeeklyPlan(raw: string): WeeklyPlan {
  // Attempt to extract JSON from markdown code fences if present
  const jsonStr = raw.includes('```')
    ? raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? raw
    : raw;

  try {
    const parsed = JSON.parse(jsonStr);
    return WeeklyPlanSchema.parse(parsed);
  } catch {
    // Fallback: return a safe default plan
    return generateSafeDefaultPlan(user);
  }
}
```

---

## Streaming Implementation

The coach chat UI must use streaming (SSE) so users see the response as it's generated — never a loading spinner while waiting for the full response.

```ts
// API route: POST /api/coach/message
import Anthropic from '@anthropic-ai/sdk';
import { streamText } from 'ai';  // or raw SSE via Response

export async function POST(req: Request) {
  const { userId, checkinData } = await req.json();

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: buildSystemPrompt(user, goal, streak, checkin),
    messages: [{ role: 'user', content: buildUserMessage(checkin) }],
  });

  // Return SSE stream to the client
  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

```tsx
// Client-side: CoachChat screen
// Use useChat from 'ai/react' or a raw EventSource reader
// Show typing indicator ("Mentor is thinking...") until first chunk arrives
// Render streaming text character by character
```

Client rules:
- Show a typing indicator ("Mentor is thinking...") before first chunk
- Render text incrementally as chunks arrive
- Streaming error: show the cached fallback message instead — never a broken stream UI

---

## API Call Implementation

```ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateCoachResponse(
  user: User,
  goal: Goal,
  streak: Streak,
  checkin: Checkin
): Promise<string> {
  const systemPrompt = buildSystemPrompt(user, goal, streak, checkin);
  const moodSummary = summariseMoodTrend(await getRecentCheckins(user.id));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: buildUserMessage(checkin),
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  return validateCoachResponse(raw);
}
```

---

## Context Window & Cost Management

- Claude can reject requests that exceed its context limit — keep the system prompt under 2000 tokens
- The user message should be under 500 tokens
- Recent check-in history sent to Claude must not exceed 14 days — truncate older data
- Token budget per response: max 300 output tokens, target ~100 tokens for coaching messages
- Track usage: log `{ userId, model, inputTokens, outputTokens, cost }` to `coach_usage` table
  - Cost estimate: input ~$3/MTok, output ~$15/MTok (Claude Sonnet 4 pricing)
  - Alert if a single user exceeds 50K output tokens per month

---

## Adaptive Goal Logic

```ts
// Reduce goal difficulty if mood < 3 for 3+ consecutive days
function shouldAdaptGoal(recentCheckins: Checkin[]): boolean {
  const last3 = recentCheckins.slice(-3);
  return last3.length === 3 && last3.every(c => c.mood <= 2);
}

// Increase ambition if mood >= 4 and task_completed for 5+ days
function shouldEscalateGoal(recentCheckins: Checkin[]): boolean {
  const last5 = recentCheckins.slice(-5);
  return last5.length === 5 && last5.every(c => c.mood >= 4 && c.task_completed);
}
```

---

## Error Handling

- If Claude API is unavailable (429, 500, or network error), serve a pre-written fallback message from the pool below (10+ options, randomised)
- If streaming fails mid-response, send the buffered text + a fallback closing sentence
- Never show a blank coaching response — always show something human
- Cap AI coaching calls at **20/hour per user** — return cached last response if exceeded (cache TTL: 1 hour)
- Rate limit exceeded: include a header in the response: `X-RateLimit-Reset: <unix-timestamp>`
- Log all AI responses with `user_id` + timestamp + token count for quality review (strip PII from logs)

---

## Testing Strategy

### Unit Tests
- `sanitizeForPrompt()`: test HTML stripping, template injection chars, edge-case names
- `buildSystemPrompt()`: test that sanitised values appear, raw values do not leak
- `shouldAdaptGoal()` / `shouldEscalateGoal()`: test boundary conditions (2 vs 3 days, mood thresholds)
- `validateCoachResponse()`: test empty, refusal, and valid responses
- `parseWeeklyPlan()`: test valid JSON, malformed JSON, markdown-wrapped JSON, missing fields

### Integration Tests
- `/api/coach/message`: mock the Claude API, assert the correct system prompt shape is sent
- Streaming endpoint: test that SSE headers are returned and chunks arrive

### Snapshot / Tone Tests
- Collect a set of sample user profiles and assert the generated response does not contain prohibited patterns (bullet points, AI disclaimers, shame language)
- Fallback message pool: verify all 10+ messages are different and on-tone

```ts
// Example: tone snapshot test
describe('coach tone', () => {
  it('does not contain shame language', async () => {
    const response = await generateCoachResponse(mockUser, mockGoal, mockStreak, mockCheckin);
    expect(response).not.toMatch(/you failed|you broke|falling behind/i);
    expect(response).not.toMatch(/as an AI|I apologise/i);
  });
});
```

### Mocking
- Always mock the Claude API in tests — never hit the live API
- Use `vi.mock('@anthropic-ai/sdk')` (Vitest) or `jest.mock` (Jest)
- See `code-style.md` (Testing Standards) for full mocking guidance

---

## Fallback Message Pool

Must contain 10+ messages. All randomised, all on-tone.

```ts
const fallbacks: string[] = [
  "You showed up today. That's not nothing — that's everything. See you tomorrow.",
  "Small steps compound. Trust the process you've already started.",
  "Every check-in is a vote for the person you're becoming. Keep voting.",
  "Progress isn't always visible, but it's always happening when you stay consistent.",
  "The day you do it when you don't feel like it — that's the day it counts most.",
  "You don't need to be perfect. You just need to keep showing up.",
  "Consistency is what turns ability into achievement. You're building it right now.",
  "Some days are about surviving. Some are about thriving. Both count equally.",
  "Your future self is thanking you for today. Keep going.",
  "This is how habits are built — one quiet, unglamorous check-in at a time.",
  "You're not behind. You're exactly where you need to be to keep moving forward.",
  "The only person you're competing with is who you were yesterday. You're winning.",
];
```

---

## Cross-References

| File / Resource | Why |
|---|---|
| `security.md` | Prompt sanitisation, PII stripping, rate limiting |
| `code-style.md` | Testing standards (mock Claude API), error handling patterns |
| `design-system.md` | Coach message bubble UI, empty/loading/error states |
| `AGENTS.md` | User state machine, coach behaviour rules, analytics events, monetisation tiers |
| `component-builder` skill | CoachMessageBubble component spec |
| `screen-builder` skill | Coach chat screen template, streaming UI wiring |
