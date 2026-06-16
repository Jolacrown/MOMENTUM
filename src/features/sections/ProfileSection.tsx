'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Crown, Mail, Check, ChevronRight, Bell, Shield, Database,
  Info, HelpCircle, LogOut, Target, BookOpen, Clock, Camera,
} from 'lucide-react';
import { useAuthStore } from '@/stores/web/auth-store-web';
import { uploadAvatar, extractAvatarPath, deleteAvatar, updateUserAvatar } from '@/features/profile/profile.service';
import { openFlutterwaveCheckout } from '@/lib/payments/flutterwave-checkout';
import { supabase } from '@/lib/supabase-web';

interface Preference { id: number; label: string; value: string; options: string[]; }

const PROFILE_PREFERENCES: Preference[] = [
  { id: 1, label: 'Skill Level', value: 'Intermediate', options: ['Beginner', 'Intermediate', 'Advanced'] },
  { id: 2, label: 'Learning Style', value: 'Visual', options: ['Visual', 'Reading', 'Hands-on'] },
  { id: 3, label: 'Daily Time', value: '30 minutes', options: ['5 minutes', '15 minutes', '30 minutes', '1 hour+'] },
];

interface ReminderOption { id: number; label: string; enabled: boolean; time?: string; }

const DEFAULT_REMINDERS: ReminderOption[] = [
  { id: 1, label: 'Morning Check-in', enabled: true, time: '08:00' },
  { id: 2, label: 'Evening Reflection', enabled: true, time: '20:00' },
  { id: 3, label: 'Streak Reminder', enabled: false },
  { id: 4, label: 'Weekly Summary', enabled: true },
];

export function ProfileSection() {
  const router = useRouter();
  const { signOut, user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [preferences, setPreferences] = useState(PROFILE_PREFERENCES);
  const [editingPref, setEditingPref] = useState<number | null>(null);
  const [editSelection, setEditSelection] = useState('');
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [editingReminder, setEditingReminder] = useState<number | null>(null);
  const [editTime, setEditTime] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const isPremium = !!(user?.app_metadata?.isPremium || user?.user_metadata?.isPremium);

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    setUploadError(null);
    setUploading(true);

    try {
      const oldUrl = avatarUrl;
      const newUrl = await uploadAvatar(user.id, file);

      if (oldUrl) {
        const oldPath = extractAvatarPath(oldUrl);
        if (oldPath) deleteAvatar(oldPath);
      }

      await updateUserAvatar(newUrl);
      setAvatarUrl(newUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const txRef = `MOMENTUM-PREMIUM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await openFlutterwaveCheckout({
        txRef,
        amount: 1200,
        email: user?.email || '',
        name: displayName,
        onSuccess: async (transactionId) => {
          try {
            const res = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionId, userId: user?.id, email: user?.email, name: displayName }),
            });
            const result = await res.json();
            if (result.verified) {
              await supabase.auth.updateUser({ data: { isPremium: true } });
              await supabase.auth.refreshSession();
              alert('Welcome to Premium! Your account has been upgraded.');
            }
          } catch {
            alert('Payment verified but upgrade processing failed. Please contact support.');
          } finally {
            setUpgrading(false);
          }
        },
        onClose: () => {
          setUpgrading(false);
        },
      });
    } catch {
      setUpgrading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.replace('/auth/login');
  };

  const toggleReminder = (id: number) => setReminders((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const saveTime = (id: number) => { setReminders((prev) => prev.map((r) => r.id === id ? { ...r, time: editTime } : r)); setEditingReminder(null); };
  const openEdit = (pref: Preference) => { setEditingPref(pref.id); setEditSelection(pref.value); };
  const saveEdit = () => { setPreferences((prev) => prev.map((p) => p.id === editingPref ? { ...p, value: editSelection } : p)); setEditingPref(null); };

  return (
    <div className="space-y-6">
      <div className="bg-bg-surface rounded-xl p-6 border border-border-base shadow-sm text-center space-y-3">
        <div className="relative mx-auto w-fit">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full relative group cursor-pointer"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={96}
                height={96}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-4xl font-display font-800 text-white">{displayInitial}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              {uploading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={22} className="text-white" />
              )}
            </div>
          </div>
          {isPremium && (
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-500 border-2 border-bg-surface flex items-center justify-center">
              <Crown size={12} className="text-white" />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarSelect}
          />
        </div>
        <div>
          <h2 className="text-lg font-display font-800 text-text-primary">{displayName}</h2>
          <div className="flex items-center justify-center gap-1.5 text-sm text-text-secondary mt-0.5">
            <Mail size={14} />
            <span>{user?.email || 'No email'}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-500 text-xs font-bold">{isPremium ? 'Premium' : 'Free'}</span>
        </div>
        {uploadError && (
          <p className="text-xs text-error-500 mt-2">{uploadError}</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold font-display text-text-primary mb-3">Preferences</h3>
        <div className="bg-bg-surface rounded-xl border border-border-base shadow-sm divide-y divide-border-base">
          {preferences.map((pref) => (
            <button key={pref.id} onClick={() => openEdit(pref)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                {pref.id === 1 ? <Target size={16} className="text-primary-500" /> : pref.id === 2 ? <BookOpen size={16} className="text-primary-500" /> : <Clock size={16} className="text-primary-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{pref.label}</p>
                <p className="text-xs text-text-muted">{pref.value}</p>
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold font-display text-text-primary mb-3">Reminders</h3>
        <div className="bg-bg-surface rounded-xl border border-border-base shadow-sm divide-y divide-border-base">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => toggleReminder(reminder.id)} className={`w-10 h-6 rounded-full transition-colors ${reminder.enabled ? 'bg-primary-500' : 'bg-bg-elevated'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${reminder.enabled ? 'left-5' : 'left-1'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{reminder.label}</p>
              </div>
              {reminder.enabled && reminder.time && (
                editingReminder === reminder.id ? (
                  <div className="flex items-center gap-1">
                    <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-16 text-xs bg-bg-elevated rounded px-1 py-0.5 text-text-primary border border-border-base" />
                    <button onClick={() => saveTime(reminder.id)} className="text-primary-500 text-xs font-bold">Save</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingReminder(reminder.id); setEditTime(reminder.time || ''); }} className="text-xs font-semibold text-text-secondary hover:text-text-primary">{reminder.time}</button>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold font-display text-text-primary mb-3">Subscription</h3>
        <div className="bg-bg-surface rounded-xl border border-border-base shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border-base bg-bg-elevated text-center space-y-3">
              <p className="text-sm font-bold text-text-primary">Free</p>
              <p className="text-2xl font-display font-800 text-text-primary">$0</p>
              <p className="text-xs text-text-muted">1 active goal</p>
              <ul className="space-y-1.5 text-xs text-left">
                {['1 active goal', 'Daily check-ins'].map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <Check size={12} className="text-success-500" />
                    <span className="text-text-secondary">{f}</span>
                  </li>
                ))}
                {['Unlimited goals', 'AI coaching'].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 opacity-40">
                    <span className="text-text-muted">—</span>
                    <span className="text-text-muted">{f}</span>
                  </li>
                ))}
              </ul>
              {!isPremium && <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-500 text-xs font-bold">Current</span>}
            </div>
            <div className="p-4 rounded-xl border-2 border-primary-500 bg-bg-surface relative text-center space-y-3">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-bold">Popular</span>
              <p className="text-sm font-bold text-text-primary">Premium</p>
              <p className="text-2xl font-display font-800 text-text-primary">₦1,200</p>
              <p className="text-xs text-text-muted">/month</p>
              <ul className="space-y-1.5 text-xs text-left">
                {['Unlimited goals', 'AI coaching', 'Advanced analytics', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <Check size={12} className="text-success-500" />
                    <span className="text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>
              {isPremium ? (
                <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-500 text-xs font-bold">Active</span>
              ) : (
                <button onClick={handleUpgrade} disabled={upgrading} className="w-full py-2.5 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{upgrading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}{upgrading ? 'Processing...' : 'Upgrade'}</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold font-display text-text-primary mb-3">Settings</h3>
        <div className="bg-bg-surface rounded-xl border border-border-base shadow-sm divide-y divide-border-base">
          {[
            { icon: Bell, label: 'Notifications', desc: 'Manage push and email preferences', color: 'text-primary-500' },
            { icon: Shield, label: 'Privacy', desc: 'Data and privacy settings', color: 'text-success-500' },
            { icon: Database, label: 'Export Data', desc: 'Download your progress data', color: 'text-info-500' },
            { icon: Info, label: 'About', desc: 'Version 1.0.0', color: 'text-text-muted' },
            { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs and contact us', color: 'text-warning-500' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors text-left">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Icon size={16} className={item.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={handleLogout} disabled={loggingOut} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border-base bg-bg-surface text-text-secondary text-sm font-bold hover:bg-bg-elevated transition-colors disabled:opacity-50">
        <LogOut size={18} />
        {loggingOut ? 'Signing out...' : 'Sign Out'}
      </button>

      <div className="h-10" />

      {editingPref !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-bg-surface rounded-xl max-w-sm w-full p-6 space-y-4">
            <h4 className="text-sm font-bold text-text-primary">Edit {preferences.find(p => p.id === editingPref)?.label}</h4>
            <div className="space-y-1">
              {(preferences.find(p => p.id === editingPref)?.options || []).map((opt) => (
                <button key={opt} onClick={() => setEditSelection(opt)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${editSelection === opt ? 'bg-primary-50 text-primary-500 font-bold' : 'text-text-secondary hover:bg-bg-elevated'}`}>{opt}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingPref(null)} className="flex-1 py-2.5 rounded-lg border border-border-base text-sm font-semibold text-text-secondary hover:bg-bg-elevated">Cancel</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600">Save</button>
            </div>
          </div>
        </div>
      )}
      <div className="h-20" />
    </div>
  );
}
