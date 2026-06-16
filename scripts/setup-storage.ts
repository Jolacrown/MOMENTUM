/**
 * Run this script once to create the avatars storage bucket:
 *
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/setup-storage.ts
 *
 * Or paste the SQL from supabase/migrations/00004_create_avatar_bucket.sql
 * into your Supabase Dashboard SQL Editor.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: existing, error: checkError } = await supabase
    .storage
    .getBucket('avatars');

  if (existing) {
    console.log('Bucket "avatars" already exists.');
    return;
  }

  const { error } = await supabase
    .storage
    .createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

  if (error) {
    console.error('Failed to create bucket:', error.message);
    process.exit(1);
  }

  console.log('Bucket "avatars" created successfully.');
}

main();
