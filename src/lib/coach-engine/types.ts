export type UserState =
  | 'ON_FIRE'
  | 'CONSISTENT'
  | 'BUILDING'
  | 'RECOVERING'
  | 'SLUMPING'
  | 'JUST_STARTING'
  | 'ACHIEVEMENT';

export interface CoachInput {
  userName: string;
  goalTitle: string;
  streakCount: number;
  longestStreak: number;
  completionRate: number;
  missedDays: number;
  momentumScore: number;
  todayCheckedIn: boolean;
}

export interface CoachOutput {
  state: UserState;
  motivationalMessage: string;
  accountabilityMessage: string;
  personalizedRecommendation: string;
  suggestedNextAction: string;
}
