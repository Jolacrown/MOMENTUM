'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, BellRing, Flame, Target, Sparkles, TrendingUp, Star, Clock, CheckCheck, X, Trash2,
} from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';
import type { AppNotification } from '@/types';

const TYPE_CONFIG: Record<string, { icon: React.FC<{ size: number; stroke: string }>; color: string }> = {
  streak: { icon: Flame, color: '#F97316' },
  checkin: { icon: BellRing, color: '#3B82F6' },
  coach: { icon: Sparkles, color: '#A78BFA' },
  goal: { icon: Target, color: '#22C55E' },
  milestone: { icon: Star, color: '#EAB308' },
  reminder: { icon: Clock, color: '#A0A09A' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationPanel() {
  const { notifications, isOpen, loading, unreadCount, setOpen, markAsRead, markAllAsRead, dismissNotification, dismissAll, fetchNotifications } = useNotificationStore();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && notifications.length === 0) fetchNotifications();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = (notif: AppNotification) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.actionRoute) {
      const route = notif.actionRoute.replace('/(app)', '').replace('/(auth)', '/auth');
      router.push(route);
      setOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className="absolute top-14 right-4 w-[380px] max-h-[520px] bg-bg-surface rounded-xl border border-border-base shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-base">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-text-primary" />
            <span className="text-sm font-bold font-display text-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs font-semibold text-primary-500 hover:text-primary-400">
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-secondary">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Bell size={32} className="text-text-muted" />
              <p className="text-sm font-bold text-text-primary">All caught up</p>
              <p className="text-xs text-text-muted">No new notifications</p>
            </div>
          ) : (
            <>
              {notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.reminder;
                const Icon = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleAction(notif)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-border-base transition-colors ${!notif.read ? 'bg-primary-50' : 'hover:bg-bg-elevated'}`}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: config.color + '18' }}>
                      <Icon size={18} stroke={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${!notif.read ? 'font-bold text-text-primary' : 'font-semibold text-text-primary'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-text-muted flex-shrink-0">{timeAgo(notif.createdAt)}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{notif.body}</p>
                      {notif.actionLabel && (
                        <p className="text-xs font-bold text-primary-500 mt-1">{notif.actionLabel}</p>
                      )}
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); dismissNotification(notif.id); } }}
                      className="text-text-muted hover:text-text-secondary flex-shrink-0 p-1 cursor-pointer"
                      aria-label="Dismiss notification"
                    >
                      <X size={14} />
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex justify-center py-2.5 border-t border-border-base">
            <button onClick={dismissAll} className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-secondary">
              <Trash2 size={14} />
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
