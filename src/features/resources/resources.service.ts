import { supabase } from '@/lib/supabase-web';

export interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: 'video' | 'course' | 'mentor' | 'workshop' | 'article' | 'book' | string;
  category: string;
  skill_level: string;
  duration: string;
  thumbnail_url: string;
  provider: string;
  resource_url: string;
  created_at: string;
}

export const getRecommendedResources = async (category?: string, skillLevel?: string): Promise<Resource[]> => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let query = supabase.from('resources').select('*');

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  if (skillLevel && skillLevel !== 'All') {
    query = query.eq('skill_level', skillLevel);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch resources: ${error.message}`);
  }

  return data || [];
};

export const getResourceById = async (id: string): Promise<Resource | null> => {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Resources Service] Error fetching resource by ID:', error);
    return null;
  }
  return data;
};

export const toggleSaveResource = async (userId: string, resourceId: string): Promise<boolean> => {
  const { data: existing } = await supabase
    .from('saved_resources')
    .select('*')
    .eq('user_id', userId)
    .eq('resource_id', resourceId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('saved_resources')
      .delete()
      .eq('id', existing.id);
    return !error ? false : true;
  } else {
    const { error } = await supabase
      .from('saved_resources')
      .insert([{ user_id: userId, resource_id: resourceId }]);
    return !error ? true : false;
  }
};

export const trackResourceAnalytics = async (userId: string, resourceId: string, action: string) => {
  await supabase
    .from('resource_analytics')
    .insert([{ user_id: userId, resource_id: resourceId, action }]);
};
