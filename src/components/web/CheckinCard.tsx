'use client';

import { Check } from 'lucide-react';

interface CheckinCardProps {
  goalTitle: string;
  isCompleted: boolean;
  onToggle: () => void;
}

export function CheckinCard({ goalTitle, isCompleted, onToggle }: CheckinCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${isCompleted ? 'bg-success-50 border-success-500' : 'bg-bg-surface border-border-base hover:border-primary-300'}`}
    >
      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isCompleted ? 'bg-success-500 border-success-500' : 'border-border-light'}`}>
        {isCompleted && <Check size={14} strokeWidth={3} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold font-display ${isCompleted ? 'text-success-500 line-through' : 'text-text-primary'}`}>
          {goalTitle}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {isCompleted ? "Today's task completed!" : 'Complete your daily action'}
        </p>
      </div>
    </button>
  );
}
