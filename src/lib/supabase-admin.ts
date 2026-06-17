import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('Supabase URL or Service Role Key is missing');
}

let _admin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _admin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getAdmin()[prop as keyof SupabaseClient];
  },
});
