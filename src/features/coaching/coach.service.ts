import { User, Goal } from '../../types';
import { supabase } from '@/lib/supabase-web';
import { getRandomFallback } from '../../lib/coach';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessageToCoach(
  user: User,
  goal: Goal,
  message: string,
  messages: Message[]
): Promise<string> {
  if (!user.id || !goal.id || !message.trim()) {
    return getRandomFallback();
  }

  try {
    // 1. Log the user message to Supabase
    await supabase.from('coach_messages').insert({
      user_id: user.id,
      content: message,
      trigger: 'checkin', // Default enum mapping
    });

    // 2. Here we would normally call a Supabase Edge Function to hit Claude.
    // For now, we simulate the reply.
    const reply = getRandomFallback();

    // 3. Log the coach response to Supabase
    await supabase.from('coach_messages').insert({
      user_id: user.id,
      content: reply,
      trigger: 'checkin',
    });

    return reply;
  } catch (error) {
    console.error('Failed to send message:', error);
    return getRandomFallback();
  }
}
