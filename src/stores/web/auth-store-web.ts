'use client';

import { create } from 'zustand';
import { Session, User as SupabaseUser, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-web';


const AUTH_COOKIE = 'sb-access-token';

function setAuthCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `${AUTH_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=604800`;
  } else {
    document.cookie = `${AUTH_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
  }
}

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  _cleanup: (() => void) | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; requiresEmailConfirmation?: boolean }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,
  _cleanup: null as (() => void) | null,

  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Error fetching session:', error);
      set({ session, user: session?.user ?? null, accessToken: session?.access_token ?? null, isInitialized: true });
      setAuthCookie(session?.access_token ?? null);
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, newSession) => {
        set({ session: newSession, user: newSession?.user ?? null, accessToken: newSession?.access_token ?? null });
        setAuthCookie(newSession?.access_token ?? null);
      });
      set({ _cleanup: () => subscription.unsubscribe() });
    } catch (e) {
      console.error('Auth initialization error:', e);
      set({ isInitialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ isLoading: false });
        const friendlyMessage = error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message;
        return { error: friendlyMessage };
      }
      const accessToken = data.session?.access_token ?? null;
      set({ user: data.user, session: data.session, accessToken, isLoading: false });
      setAuthCookie(accessToken);
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      set({ isLoading: false });
      return { error: msg };
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/login?confirmed=true` } });
      if (error) { set({ isLoading: false }); return { error: error.message }; }
      if (!data.session) {
        set({ isLoading: false });
        return { error: null, requiresEmailConfirmation: true };
      }
      set({ user: data.user, session: data.session, accessToken: data.session?.access_token ?? null, isLoading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      set({ isLoading: false });
      return { error: msg };
    }
  },

  resendConfirmation: async (email: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/auth/login?confirmed=true` } });
      set({ isLoading: false });
      if (error) { return { error: error.message }; }
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend confirmation';
      set({ isLoading: false });
      return { error: msg };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try { get()._cleanup?.(); await supabase.auth.signOut(); } catch (err) { console.error('[Auth] signOut error:', err); }
    finally { setAuthCookie(null); set({ user: null, session: null, accessToken: null, _cleanup: null, isLoading: false }); }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/login` });
      set({ isLoading: false });
      return { error: error?.message ?? null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reset password failed';
      set({ isLoading: false });
      return { error: msg };
    }
  },

  clearAuth: async () => { try { get()._cleanup?.(); await supabase.auth.signOut(); } catch { /* ok */ } setAuthCookie(null); set({ user: null, session: null, accessToken: null, _cleanup: null }); },
}));
