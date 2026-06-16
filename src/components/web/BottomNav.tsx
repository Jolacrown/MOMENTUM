'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flag, Sparkles, BarChart3, User } from 'lucide-react';

const NAV_ITEMS = [
  { route: '/dashboard', label: 'Home', icon: Home },
  { route: '/goals', label: 'Goals', icon: Flag },
  { route: '/coach', label: 'Coach', icon: Sparkles },
  { route: '/progress', label: 'Progress', icon: BarChart3 },
  { route: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border-base z-40 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.route);
          return (
            <Link
              key={item.route}
              href={item.route}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${isActive ? 'text-primary-500' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Icon size={20} {...(isActive ? { strokeWidth: 2.5 } : {})} />
              <span className={`text-[10px] font-semibold ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
