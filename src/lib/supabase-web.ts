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
      throw new Error(
        'Supabase environment variables are missing. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
      );
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

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});
