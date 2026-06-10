/**
 * On-tone fallback messages for the AI Coach.
 * Used when the AI API is unavailable or rate-limited.
 */

export const COACH_FALLBACKS = [
  "Great job showing up today! Consistency is the secret sauce. Keep that momentum going.",
  "I'm here to support you. Even a small action today counts as a win. What's your next move?",
  "Remember: progress over perfection. You're doing better than you think.",
  "Momentum pauses, it doesn't disappear. Ready to take the next step together?",
  "Showing up is 80% of the work. You've already done the hard part today.",
  "Growth takes time, but every single check-in brings you closer to your goal.",
  "I'm proud of your consistency. Let's keep this fire burning!",
  "Take a deep breath. You're making steady progress. What can we do today to move 1% forward?",
];

export const getRandomFallback = () => {
  return COACH_FALLBACKS[Math.floor(Math.random() * COACH_FALLBACKS.length)];
};
