export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LearningStyle = 'Visual' | 'Reading' | 'Hands-on';

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  skillLevel?: SkillLevel;
  learningStyle?: LearningStyle;
  dailyTimePreference?: number; // in minutes
  reminderTime?: string; // HH:mm format
  isOnboarded: boolean;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  status: GoalStatus;
  currentStreak: number;
  longestStreak: number;
  lastCheckinAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
