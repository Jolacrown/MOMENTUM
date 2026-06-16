export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LearningStyle = 'Visual' | 'Reading' | 'Hands-on';

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  skillLevel?: SkillLevel;
  learningStyle?: LearningStyle;
  dailyTimePreference?: number;
  reminderTime?: string;
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

export type NotificationType = 'streak' | 'checkin' | 'coach' | 'goal' | 'milestone' | 'reminder';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actionLabel?: string;
  actionRoute?: string;
}
