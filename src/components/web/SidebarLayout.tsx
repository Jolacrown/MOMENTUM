'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, LayoutDashboard, Flag, BarChart3, BookOpen, User, Bell, Menu, X, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/web/auth-store-web';
import { useNotificationStore } from '@/stores/notification-store';
import { NotificationPanel } from './NotificationPanel';
import { BottomNav } from './BottomNav';

const NAV_ITEMS = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'goals', label: 'Goals', icon: Flag },
  { view: 'coach', label: 'AI Coach', icon: Sparkles },
  { view: 'progress', label: 'Progress', icon: BarChart3 },
  { view: 'resources', label: 'Resources', icon: BookOpen },
  { view: 'profile', label: 'Profile', icon: User },
];

const SIDEBAR_BTN_STYLE: React.CSSProperties = { border: 'none', outline: 'none', boxShadow: 'none' };

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeView = pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const router = useRouter();
  const { signOut } = useAuthStore();
  const { unreadCount, toggleOpen } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await signOut(); } catch { /* proceed with redirect */ }
    router.replace('/auth/login');
  };

  const navigate = (view: string) => {
    router.push(`/${view}`);
  };

  return (
    <div className="h-screen bg-bg-base flex">
      {/* Desktop Sidebar — fixed to viewport, full height, signout pinned to bottom */}
      <aside className="hidden md:flex md:flex-col w-60 bg-bg-surface border-r border-border-base fixed top-0 left-0 min-h-screen h-screen z-30 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border-base flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
            <Sparkles size={20} className="text-primary-500" />
          </div>
          <span className="text-xl font-display font-800 text-text-primary tracking-tight">Momentum</span>
        </div>

        {/* Nav — fills remaining space, pushes footer to bottom */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                style={SIDEBAR_BTN_STYLE}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-primary-50 text-primary-500' : 'text-text-secondary hover:bg-primary-50/40 hover:text-text-primary'}`}
              >
                <Icon size={20} {...(isActive ? { strokeWidth: 2.5 } : {})} />
                <span className={`text-sm ${isActive ? 'font-bold text-primary-500' : 'font-semibold'}`}>{item.label}</span>
                {isActive && <span className="w-1 h-5 rounded-full bg-primary-500 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Signout — pinned to bottom via flex-1 on nav above */}
        <div className="border-t border-border-base p-2 space-y-0.5 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-error-500 hover:bg-error-50 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-bg-surface shadow-lg">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border-base">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary-500" />
                </div>
                <span className="text-xl font-display font-800 text-text-primary">Momentum</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-text-muted hover:text-text-secondary p-1" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="py-3 px-2 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => { navigate(item.view); setMobileMenuOpen(false); }}
                    style={SIDEBAR_BTN_STYLE}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary-50 text-primary-500' : 'text-text-secondary hover:bg-primary-50/40 hover:text-text-primary'}`}
                  >
                    <Icon size={20} {...(isActive ? { strokeWidth: 2.5 } : {})} />
                    <span className={`text-sm ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-border-base p-2">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-error-500 hover:bg-error-50">
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-6 bg-bg-base border-b border-border-base">
          <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-text-primary p-1" aria-label="Open menu">
                <Menu size={22} />
              </button>
            <h1 className="text-xl font-display font-800 text-text-primary tracking-tight">
              {NAV_ITEMS.find((n) => n.view === activeView)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleOpen}
              className="relative w-10 h-10 rounded-lg bg-bg-surface border border-border-base flex items-center justify-center hover:bg-bg-elevated transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-text-secondary" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-bg-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error-500 border-2 border-bg-surface" />
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-6">
            {children}
          </div>
        </main>
      </div>

      <NotificationPanel />
      <BottomNav />
    </div>
  );
}
