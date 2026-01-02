# WNC Times - Chat Feature Fix Plan

## Current Issues

| Issue | Description | Severity |
|-------|-------------|----------|
| **API Key not configured** | Gemini API key may not be saved in Firestore `settings/config` | HIGH |
| **Model version mismatch** | ChatAssistant uses `gemini-1.5-flash`, admin shows `gemini-2.0-flash` | MEDIUM |
| **Direct browser API call** | API key exposed in client-side code | SECURITY |
| **No server-side route** | No API route to proxy requests securely | MEDIUM |
| **Missing error feedback** | User doesn't see why chat fails | LOW |

---

## Quick Fix (Immediate)

### Step 1: Verify API Key is Configured

1. Go to Admin Panel → API Configuration
2. Enter your Google Gemini API key (starts with `AIza...`)
3. Click "Test Connection" to verify
4. Click "Save Settings"

### Step 2: Update ChatAssistant Model Version

The ChatAssistant uses an older model. Update to match admin configuration:

**File:** `src/components/ChatAssistant.tsx` (Line 140)

```typescript
// BEFORE:
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,

// AFTER:
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
```

---

## Recommended Fix (Secure - Server-Side API Route)

### Why Server-Side?

- **Security**: API key stays on server, not exposed to browser
- **Control**: Add rate limiting, logging, error handling
- **Flexibility**: Easy to switch AI providers later

### Implementation

#### 1. Create API Route

**File:** `src/app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get API key from Firestore (server-side)
    const settingsDoc = await db.collection('settings').doc('config').get();
    const settings = settingsDoc.data();
    const apiKey = settings?.geminiApiKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chat service not configured' }, { status: 503 });
    }

    const model = settings?.geminiModel || 'gemini-2.0-flash';

    // Build conversation context
    const contents = [
      {
        parts: [{
          text: `You are a helpful assistant for WNC Times, a local news website covering Western North Carolina. Be friendly, concise, and helpful. Answer questions about local news, events, businesses, and community information.`
        }]
      },
      // Include history for context
      ...(history || []).map((msg: { role: string; text: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      // Current message
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 2. Create Firebase Admin SDK (Server-Side)

**File:** `src/lib/firebase-admin.ts`

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

export const db = getFirestore();
```

#### 3. Update ChatAssistant to Use API Route

**File:** `src/components/ChatAssistant.tsx`

```typescript
// Replace the direct Gemini API call (lines 139-152) with:
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: input,
    history: messages.slice(-10) // Send last 10 messages for context
  })
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Chat service unavailable');
}

const data = await response.json();
const responseText = data.response;
```

---

## Google Products Integration

Since you want to use Google products, here's what we're already using and can add:

### Currently Using
- ✅ **Firebase Auth** - User authentication
- ✅ **Firestore** - Database
- ✅ **Gemini AI** - Chat assistant
- ✅ **Firebase Hosting** - Deployment

### Can Add
- 📍 **Google Maps API** - For local business directory, event locations
- 🔍 **Google Custom Search** - Site search functionality
- 📊 **Google Analytics 4** - User analytics
- 🔔 **Firebase Cloud Messaging** - Push notifications for breaking news
- 🗣️ **Google Cloud Text-to-Speech** - Higher quality voice (vs browser TTS)
- 🌐 **Google Translate API** - Multi-language support

---

## Environment Variables Needed

Add to `.env.local`:

```bash
# Firebase Admin SDK (for server-side Firestore access)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Or individual values
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## Implementation Order

### Phase 1: Quick Fix (Do Now)
1. Configure Gemini API key in Admin → API Configuration
2. Update ChatAssistant to use `gemini-2.0-flash` model
3. Test the chat works

### Phase 2: Security Fix
1. Create `/api/chat` route
2. Set up Firebase Admin SDK
3. Update ChatAssistant to use API route
4. Add rate limiting

### Phase 3: Enhancements
1. Add conversation memory (store in Firestore)
2. Train on site content (RAG with articles)
3. Add suggested questions
4. Improve error messages

---

## Testing Checklist

- [ ] Gemini API key saved in Firestore `settings/config.geminiApiKey`
- [ ] Chat bubble appears on frontend
- [ ] Clicking opens chat window
- [ ] Sending message shows loading indicator
- [ ] Response appears from AI
- [ ] Voice toggle works (browser TTS)
- [ ] Error message shows if API key missing

---

## Notes for Jules

The quickest fix is:
1. Make sure the Gemini API key is saved in the admin panel
2. Update line 140 in ChatAssistant.tsx to use `gemini-2.0-flash`

The more secure fix involves creating a server-side API route, which keeps the API key off the client. This is recommended for production.
