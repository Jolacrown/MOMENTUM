import { getRandomFallback } from './fallbacks';
import { buildSystemPrompt } from './promptBuilder';
import { User, Goal } from '../../types';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const sendMessageToCoach = async (
  user: User,
  goal: Goal,
  message: string,
  history: Message[] = []
): Promise<string> => {
  // Check for API key (mocked for now)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return getRandomFallback();
  }

  // Real API implementation would go here
  // For now, return mock/fallback
  console.log('Prompt:', buildSystemPrompt(user, goal, {}));
  return getRandomFallback();
};
