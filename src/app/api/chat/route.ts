import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get settings from Firestore
    const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
    const settings = settingsDoc.data();

    const apiKey = settings?.geminiApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chat service not configured. Please configure the Gemini API key in Admin settings.' },
        { status: 503 }
      );
    }

    const model = 'gemini-2.0-flash';
    const systemPrompt = settings?.chatSystemPrompt || getDefaultSystemPrompt();

    // Build conversation contents for Gemini API
    const conversationContents = buildConversationContents(
      message,
      history || [],
      systemPrompt
    );

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: conversationContents,
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Gemini API configuration.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('No response text from Gemini:', JSON.stringify(data).substring(0, 200));
      return NextResponse.json(
        { error: 'No response received from AI. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultSystemPrompt(): string {
  return `You are the WNC Times Reader Assistant, a helpful AI for a local news website covering Western North Carolina.

Your capabilities:
- Help readers find articles and news about Western North Carolina
- Answer questions about local events, weather, businesses, and community happenings
- Provide information about the WNC Times website
- Be friendly, concise, and helpful

Guidelines:
- Keep responses brief and to the point (2-3 sentences when possible)
- If asked about a specific article, reference it by title
- For topics you don't have information about, suggest the reader check the website or contact the newsroom
- Do not provide medical, legal, or financial advice
- Stay focused on WNC-related topics and news`;
}

function buildConversationContents(
  currentMessage: string,
  history: ChatMessage[],
  systemPrompt: string
) {
  const contents = [];

  // Filter out any init/welcome messages
  const conversationHistory = history.filter(
    (msg) => msg.text && !msg.text.startsWith("Hi! I'm your WNC Times")
  );

  if (conversationHistory.length === 0) {
    // First message - include system context
    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n---\nUser: ${currentMessage}` }],
    });
  } else {
    // Multi-turn conversation
    const firstUserMsg = conversationHistory.find((m) => m.role === 'user');
    if (firstUserMsg) {
      contents.push({
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n---\nUser: ${firstUserMsg.text}` }],
      });
    }

    // Add remaining messages (skip the first user message already added)
    let skippedFirst = false;
    for (const msg of conversationHistory) {
      if (msg.role === 'user' && !skippedFirst) {
        skippedFirst = true;
        continue;
      }
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }],
      });
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage }],
    });
  }

  return contents;
}
