import { create } from 'zustand';
import type { AppNotification, NotificationType } from '../types';

function generateId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60 * 1000).toISOString();
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: '🔥 5-Day Streak',
    body: "You're on fire! 5 days of consistency — keep the momentum going.",
    type: 'streak',
    read: false,
    createdAt: minutesAgo(15),
    actionLabel: 'View Streak',
    actionRoute: '/(app)/progress',
  },
  {
    id: 'n2',
    title: 'Daily Check-in Reminder',
    body: "Don't forget to complete today's check-in for UI/UX Design.",
    type: 'checkin',
    read: false,
    createdAt: minutesAgo(45),
    actionLabel: 'Check In',
    actionRoute: '/(app)/dashboard',
  },
  {
    id: 'n3',
    title: '💡 Coach Insight',
    body: 'Your consistency score is 87% this week. Try increasing daily study time by 5 minutes.',
    type: 'coach',
    read: true,
    createdAt: minutesAgo(120),
    actionLabel: 'Talk to Coach',
    actionRoute: '/(app)/coach',
  },
  {
    id: 'n4',
    title: '📈 Goal Progress',
    body: 'You\'ve completed 25% of "Learn UI/UX Design" — halfway to the first milestone!',
    type: 'goal',
    read: false,
    createdAt: minutesAgo(240),
    actionLabel: 'View Goals',
    actionRoute: '/(app)/goals',
  },
  {
    id: 'n5',
    title: '⭐ Milestone Unlocked',
    body: 'First week complete! You\'ve checked in 7 days straight. Consistency Badge earned.',
    type: 'milestone',
    read: true,
    createdAt: minutesAgo(1440),
  },
  {
    id: 'n6',
    title: '⏰ Morning Reminder',
    body: 'Time for your morning reflection. How are you feeling about today\'s goals?',
    type: 'reminder',
    read: true,
    createdAt: minutesAgo(2880),
    actionLabel: 'Reflect',
    actionRoute: '/(app)/dashboard',
  },
];

interface NotificationState {
  notifications: AppNotification[];
  isOpen: boolean;
  loading: boolean;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isOpen: false,
  loading: false,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 300));
    set({
      notifications: MOCK_NOTIFICATIONS,
      loading: false,
      unreadCount: MOCK_NOTIFICATIONS.filter(n => !n.read).length,
    });
  },

  markAsRead: (id: string) => {
    const notifications = get().notifications.map(n =>
      n.id === id ? { ...n, read: true } : n,
    );
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  },

  markAllAsRead: () => {
    const notifications = get().notifications.map(n => ({ ...n, read: true }));
    set({ notifications, unreadCount: 0 });
  },

  dismissNotification: (id: string) => {
    const notifications = get().notifications.filter(n => n.id !== id);
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  },

  dismissAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    const notifications = [newNotif, ...get().notifications];
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  },

  setOpen: (open: boolean) => set({ isOpen: open }),
  toggleOpen: () => {
    const next = !get().isOpen;
    set({ isOpen: next });
    if (next) {
      get().fetchNotifications();
    }
  },
}));
