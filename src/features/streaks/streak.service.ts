import { supabase } from '@/lib/supabase-web';

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  recovery_streak: number;
  last_completed_date: string | null;
}

export const getUserStreak = async (userId: string): Promise<Streak | null> => {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return null;
  }
  
  if (!data) {
    const { data: newStreak, error: insertError } = await supabase
      .from('streaks')
      .insert([{ user_id: userId, current_streak: 0, longest_streak: 0, recovery_streak: 0 }])
      .select()
      .single();
      
    if (!insertError) return newStreak;
    return null;
  }
  
  return data;
};

// Typically called after a successful daily checkin
export const incrementStreak = async (userId: string): Promise<Streak | null> => {
  // We can do this atomically with an RPC, but doing it in logic for visibility:
  const streak = await getUserStreak(userId);
  if (!streak) return null;

  const today = new Date().toISOString().split('T')[0];
  
  // If already checked in today, do nothing.
  if (streak.last_completed_date === today) {
    return streak;
  }

  const newCurrent = streak.current_streak + 1;
  const newLongest = Math.max(streak.longest_streak, newCurrent);

  const { data, error } = await supabase
    .from('streaks')
    .update({
      current_streak: newCurrent,
      longest_streak: newLongest,
      last_completed_date: today,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error incrementing streak:', error);
    return null;
  }

  return data;
};

// Resets streak. Typically ran via cron job, or evaluated on app launch.
export const breakStreak = async (userId: string): Promise<Streak | null> => {
  const { data, error } = await supabase
    .from('streaks')
    .update({ current_streak: 0, recovery_streak: 0 })
    .eq('user_id', userId)
    .select()
    .single();

  return error ? null : data;
};
