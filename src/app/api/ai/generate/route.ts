import { NextResponse } from 'next/server';
import { openai, isAIConfigured } from '@/lib/ai';

export async function POST(request: Request) {
  if (!isAIConfigured() || !openai) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured.' },
      { status: 503 }
    );
  }

  try {
    const { prompt, systemMessage, model, maxTokens, temperature } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini', // Default to a cost-effective model
      messages: [
        { role: 'system', content: systemMessage || 'You are a helpful AI assistant for a newsroom.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens || 500,
      temperature: temperature || 0.7,
    });

    return NextResponse.json({
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during AI generation.' },
      { status: 500 }
    );
  }
}
