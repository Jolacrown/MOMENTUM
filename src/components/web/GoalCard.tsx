'use client';

import { Flame } from 'lucide-react';
import type { GoalStatus } from '@/types';

interface GoalCardProps {
  title: string;
  progressPercent: number;
  status: GoalStatus;
  streak: number;
  onPress?: () => void;
}

const statusColors: Record<GoalStatus, string> = {
  active: 'bg-success-500',
  paused: 'bg-text-muted',
  completed: 'bg-info-500',
};

export function GoalCard({ title, progressPercent, status, streak, onPress }: GoalCardProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full text-left bg-bg-surface rounded-xl p-5 border border-border-base hover:border-primary-300 hover:shadow-md transition-all duration-200 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          <span className="text-xs font-semibold text-text-muted uppercase">{status}</span>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame size={14} className="text-primary-500" />
            <span className="text-xs font-bold text-text-primary">{streak} day streak</span>
          </div>
        )}
      </div>

      <h3 className="text-base font-bold font-display text-text-primary">{title}</h3>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Progress</span>
          <span className="font-bold text-text-primary">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
}
