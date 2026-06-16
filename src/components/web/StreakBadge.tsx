import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  count: number | string;
  status?: 'active' | 'at-risk' | 'broken';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'w-12 h-12 text-lg', icon: 14, text: 'text-xs' },
  md: { container: 'w-16 h-16 text-2xl', icon: 18, text: 'text-sm' },
  lg: { container: 'w-20 h-20 text-3xl', icon: 20, text: 'text-base' },
};

const statusColors = {
  active: { bg: 'bg-primary-50', text: 'text-primary-500', icon: 'text-primary-500' },
  'at-risk': { bg: 'bg-bg-elevated', text: 'text-warning-500', icon: 'text-warning-500' },
  broken: { bg: 'bg-bg-elevated', text: 'text-text-muted', icon: 'text-text-muted' },
};

export function StreakBadge({ count, status = 'active', size = 'md' }: StreakBadgeProps) {
  const s = sizeMap[size];
  const c = statusColors[status];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${s.container} rounded-full border-2 border-current ${c.bg} ${c.text} flex items-center justify-center font-display font-800`}>
        {count}
      </div>
      <div className="flex items-center gap-1">
        <Flame size={s.icon} className={c.icon} />
        <span className={`${s.text} font-semibold ${c.text}`}>day streak</span>
      </div>
    </div>
  );
}
