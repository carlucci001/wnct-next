import { NextResponse } from 'next/server';
import { isAIConfigured } from '@/lib/ai';

export async function GET() {
  const configured = isAIConfigured();
  return NextResponse.json({
    status: configured ? 'active' : 'inactive',
    message: configured
      ? 'AI service is configured and ready.'
      : 'OpenAI API key is missing. Please configure OPENAI_API_KEY in environment variables.',
  });
}
