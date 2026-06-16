import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or Anon Key is missing');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null;
            return Promise.resolve(localStorage.getItem(key));
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') return Promise.resolve();
            localStorage.setItem(key, value);
            return Promise.resolve();
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return Promise.resolve();
            localStorage.removeItem(key);
            return Promise.resolve();
          },
        },
      },
    });
  }
  return _supabase;
}

export const supabase = getSupabaseClient();
