import { CoachInput, CoachOutput, UserState } from './types';
import { MESSAGE_TEMPLATES } from './messages';

function getNextMilestone(streak: number): number {
  if (streak < 7) return 7;
  if (streak < 14) return 14;
  if (streak < 21) return 21;
  if (streak < 30) return 30;
  const next = Math.ceil(streak / 30) * 30;
  return next > streak ? next : streak + 30;
}

export function evaluateState(input: CoachInput): UserState {
  const { streakCount, completionRate, missedDays, momentumScore, todayCheckedIn } = input;

  const isMilestone = [7, 14, 21, 30, 60, 90].includes(streakCount) && todayCheckedIn;

  if (isMilestone) {
    return 'ACHIEVEMENT';
  }

  if (missedDays >= 3 || (missedDays > 0 && completionRate < 40 && streakCount === 0)) {
    return 'SLUMPING';
  }

  if (missedDays > 0 && missedDays < 3 && streakCount >= 1) {
    return 'RECOVERING';
  }

  if (streakCount >= 5 && completionRate >= 80 && momentumScore >= 75) {
    return 'ON_FIRE';
  }

  if (streakCount >= 3 && completionRate >= 60) {
    return 'CONSISTENT';
  }

  if (streakCount >= 1) {
    return 'BUILDING';
  }

  return 'JUST_STARTING';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function personalize(template: string, input: CoachInput): string {
  return template
    .replace(/\{name\}/g, input.userName)
    .replace(/\{streak\}/g, String(input.streakCount))
    .replace(/\{longestStreak\}/g, String(input.longestStreak))
    .replace(/\{completionRate\}/g, String(Math.round(input.completionRate)))
    .replace(/\{missedDays\}/g, String(input.missedDays))
    .replace(/\{goalTitle\}/g, input.goalTitle)
    .replace(/\{nextMilestone\}/g, String(getNextMilestone(input.streakCount)));
}

function generateOutput(state: UserState, input: CoachInput): CoachOutput {
  const templates = MESSAGE_TEMPLATES[state];

  return {
    state,
    motivationalMessage: personalize(pickRandom(templates.motivational), input),
    accountabilityMessage: personalize(pickRandom(templates.accountability), input),
    personalizedRecommendation: personalize(pickRandom(templates.recommendation), input),
    suggestedNextAction: personalize(pickRandom(templates.nextAction), input),
  };
}

export function getCoachInsights(input: CoachInput): CoachOutput {
  const state = evaluateState(input);
  return generateOutput(state, input);
}
