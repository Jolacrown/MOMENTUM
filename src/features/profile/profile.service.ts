import { supabase } from '@/lib/supabase-web';

const AVATAR_BUCKET = 'avatars';

function mapStorageError(err: { message: string }): Error {
  const msg = err.message.toLowerCase();
  if (msg.includes('bucket not found')) {
    return new Error(
      'Storage bucket "avatars" does not exist. Run the SQL migration in supabase/migrations/00004_create_avatar_bucket.sql via your Supabase Dashboard SQL Editor.'
    );
  }
  return new Error(err.message);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/${Date.now()}-avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw mapStorageError(uploadError);

  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteAvatar(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([filePath]);

  if (error) console.error('Error deleting old avatar:', error);
}

export function extractAvatarPath(publicUrl: string): string | null {
  const match = publicUrl.match(/\/avatars\/(.+)$/);
  return match ? match[1] : null;
}

export async function updateUserAvatar(avatarUrl: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });
  if (error) throw new Error(error.message);
}
