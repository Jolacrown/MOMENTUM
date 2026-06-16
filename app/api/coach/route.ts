import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/coach';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const { messages, userContext } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt({
      name: userContext?.name || 'User',
      skillLevel: userContext?.skillLevel || 'Beginner',
      learningStyle: userContext?.learningStyle || 'Mixed',
      goals: userContext?.goals || [],
      currentStreak: userContext?.currentStreak || 0,
      longestStreak: userContext?.longestStreak || 0,
      recentMood: userContext?.recentMood || undefined,
      recentCheckins: userContext?.recentCheckins || 0,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const content = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    return NextResponse.json({ content });
  } catch (err) {
    console.error('[coach] API error:', err);
    return NextResponse.json(
      { error: 'Failed to get coach response' },
      { status: 500 },
    );
  }
}
