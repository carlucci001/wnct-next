import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length to avoid large API costs
    const trimmedText = text.slice(0, 2000);

    // Get API key from Firestore
    const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
    const settings = settingsDoc.data();

    const apiKey = settings?.geminiApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 503 }
      );
    }

    // Get voice from settings or use default
    const voiceName = settings?.ttsVoice || 'en-US-Neural2-F';

    // Call Google Cloud Text-to-Speech API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: trimmedText },
          voice: {
            languageCode: 'en-US',
            name: voiceName,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google TTS error:', JSON.stringify(errorData, null, 2));

      // Return the actual error message for debugging
      const errorMessage = errorData?.error?.message || `TTS API error: ${response.status}`;

      return NextResponse.json(
        { error: errorMessage, fallback: true },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return base64 audio content
    return NextResponse.json({
      audioContent: data.audioContent,
      contentType: 'audio/mp3'
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', fallback: true },
      { status: 500 }
    );
  }
}
