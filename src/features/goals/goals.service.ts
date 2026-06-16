import { supabase } from '@/lib/supabase-web';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_date: string | null;
  daily_target: string | null;
  priority: number;
  status: 'active' | 'paused' | 'completed';
  progress_percent: number;
  created_at: string;
}

export const getGoals = async (userId: string): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
  return data || [];
};

export const createGoal = async (userId: string, title: string): Promise<Goal | null> => {
  const { data, error } = await supabase
    .from('goals')
    .insert([{ user_id: userId, title, status: 'active', progress_percent: 0 }])
    .select()
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    return null;
  }
  return data;
};

export const updateGoalProgress = async (goalId: string, progress: number): Promise<void> => {
  const { error } = await supabase
    .from('goals')
    .update({ progress_percent: progress })
    .eq('id', goalId);

  if (error) {
    console.error('Error updating goal progress:', error);
  }
};
