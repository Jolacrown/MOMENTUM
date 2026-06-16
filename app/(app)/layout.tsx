import { Suspense } from 'react';
import { SidebarLayout } from '@/components/web/SidebarLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SidebarLayout>{children}</SidebarLayout>
    </Suspense>
  );
}
