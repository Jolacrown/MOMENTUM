import { supabase } from '@/lib/supabase-web';

export interface Checkin {
  id: string;
  user_id: string;
  goal_id: string;
  date: string;
  task_completed: boolean;
  mood: number | null;
  notes: string | null;
  effort_level: number | null;
}

export const logCheckin = async (
  userId: string, 
  goalId: string, 
  data: { task_completed: boolean; mood?: number; notes?: string; effort_level?: number }
): Promise<Checkin | null> => {
  const today = new Date().toISOString().split('T')[0];

  // Upsert checkin for today
  const { data: result, error } = await supabase
    .from('checkins')
    .upsert({
      user_id: userId,
      goal_id: goalId,
      date: today,
      ...data
    }, { onConflict: 'user_id,goal_id,date' })
    .select()
    .single();

  if (error) {
    console.error('Error logging checkin:', error);
    return null;
  }
  
  // Need to trigger streak update here computationally, or via DB trigger. 
  // Let's do it via streak.service for separation of concerns
  return result;
};

export const getRecentCheckinCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error counting checkins:', error);
    return 0;
  }
  return count || 0;
};

export const getRecentCheckins = async (userId: string, limit = 7): Promise<Checkin[]> => {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching checkins:', error);
    return [];
  }
  return data || [];
};
