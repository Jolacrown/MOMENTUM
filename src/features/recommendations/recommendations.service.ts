import { supabase } from '@/lib/supabase-web';

export interface Recommendation {
  id: string;
  type: 'mentor' | 'course' | 'workshop' | 'resource';
  resource_type: string | null;
  category: string | null;
  title: string;
  url: string | null;
  tags: string[];
  skill_level: string;
  is_active: boolean;
}

export const getRecommendations = async (
  filters?: { resource_type?: string; category?: string; skill_level?: string }
): Promise<Recommendation[]> => {
  let query = supabase.from('recommendations').select('*').eq('is_active', true);

  if (filters?.resource_type) {
    query = query.eq('resource_type', filters.resource_type);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.skill_level) {
    query = query.eq('skill_level', filters.skill_level);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recommendations from Supabase:', error.message);
    return [];
  }
  return data || [];
};
