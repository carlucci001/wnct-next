import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Load all documentation files
function loadDocumentation(): string {
  const docsPath = path.join(process.cwd(), 'docs', 'admin');
  const files = [
    '01-GETTING-STARTED.md',
    '02-CONTENT-MANAGEMENT.md',
    '03-AI-AGENTS.md',
    '04-USER-MANAGEMENT.md',
    '05-SITE-CONFIGURATION.md',
    '06-PLUGINS-APIS.md',
    '07-COMPONENTS.md',
    '08-TOOLS-MAINTENANCE.md'
  ];

  let documentation = '';
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(docsPath, file), 'utf-8');
      documentation += `\n\n=== ${file} ===\n${content}`;
    } catch (e) {
      console.warn(`Could not load ${file}:`, e);
    }
  }
  return documentation;
}

const SYSTEM_PROMPT = `You are the Admin Assistant for WNC Times, a news publishing platform.

Your job is to help administrators understand and use the admin panel. You have comprehensive knowledge of:
- Content management (articles, newsletters, categories, comments, media)
- AI Agents (Journalist, Editor, SEO, Social, GEO agents)
- User management (roles, permissions, personas)
- Site configuration and settings
- API/Plugin configuration
- Components (directory, ads, blog, events, community)
- Maintenance tools

Guidelines:
1. Give specific, step-by-step instructions
2. Reference which section of the admin panel to navigate to
3. Keep responses concise but complete
4. If unsure, say so and suggest where to look
5. Use bullet points for multi-step tasks

Here is your knowledge base:

{DOCUMENTATION}`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    // Get Gemini API key from Firestore
    const db = getDb();
    const configDoc = await getDoc(doc(db, 'settings', 'config'));
    const config = configDoc.data();
    const apiKey = config?.geminiApiKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Load documentation and build prompt
    const documentation = loadDocumentation();
    const systemPrompt = SYSTEM_PROMPT.replace('{DOCUMENTATION}', documentation);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt
    });

    // Build chat history
    const chatHistory = history?.map((msg: ChatMessage) => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })) || [];

    // Send message
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Admin chat error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
