'use client';

import { usePathname } from 'next/navigation';
import { DashboardSection } from '@/features/sections/DashboardSection';
import { GoalsSection } from '@/features/sections/GoalsSection';
import { CoachSection } from '@/features/sections/CoachSection';
import { ProgressSection } from '@/features/sections/ProgressSection';
import { ResourcesSection } from '@/features/sections/ResourcesSection';
import { ProfileSection } from '@/features/sections/ProfileSection';

export default function AppViewPage() {
  const pathname = usePathname();
  const view = pathname.split('/').filter(Boolean)[0] || 'dashboard';

  switch (view) {
    case 'goals':
      return <GoalsSection />;
    case 'coach':
      return <CoachSection />;
    case 'progress':
      return <ProgressSection />;
    case 'resources':
      return <ResourcesSection />;
    case 'profile':
      return <ProfileSection />;
    default:
      return <DashboardSection />;
  }
}
