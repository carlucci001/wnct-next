import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceConfig } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length to avoid large API costs
    const trimmedText = text.slice(0, 2000);

    // Get settings from Firestore
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();

    // Check which TTS provider to use
    const ttsProvider = settings?.ttsProvider || 'google';

    if (ttsProvider === 'elevenlabs' && settings?.elevenLabsApiKey) {
      // Use persona's voice if provided, otherwise fall back to global settings
      const voiceId = voiceConfig?.voiceId || settings?.elevenLabsVoiceId;
      if (!voiceId) {
        // No voice configured, fall back to Google TTS
        return await googleTTS(trimmedText, settings);
      }
      // Use ElevenLabs with persona voice settings override
      return await elevenLabsTTS(trimmedText, settings.elevenLabsApiKey as string, voiceId as string, settings, voiceConfig);
    } else {
      // Use Google Cloud TTS
      return await googleTTS(trimmedText, settings);
    }

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', fallback: true },
      { status: 500 }
    );
  }
}

// Voice config from persona
interface PersonaVoiceConfig {
  voiceId?: string;
  voiceName?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

// ElevenLabs TTS
async function elevenLabsTTS(
  text: string,
  apiKey: string,
  voiceId: string,
  settings: Record<string, unknown> | undefined,
  voiceConfig?: PersonaVoiceConfig
) {
  try {
    // Use persona voice settings if provided, otherwise fall back to global settings
    const model = (settings?.elevenLabsModel as string) || 'eleven_turbo_v2';
    const stability = voiceConfig?.stability ?? (settings?.elevenLabsStability as number) ?? 0.5;
    const similarity = voiceConfig?.similarityBoost ?? (settings?.elevenLabsSimilarity as number) ?? 0.75;
    const style = voiceConfig?.style ?? (settings?.elevenLabsStyle as number) ?? 0;
    const speakerBoost = voiceConfig?.useSpeakerBoost ?? (settings?.elevenLabsSpeakerBoost as boolean) ?? true;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability,
            similarity_boost: similarity,
            style,
            use_speaker_boost: speakerBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', errorText);
      return NextResponse.json(
        { error: `ElevenLabs error: ${response.status}`, fallback: true },
        { status: response.status }
      );
    }

    // ElevenLabs returns raw audio bytes
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      audioContent: base64Audio,
      contentType: 'audio/mpeg',
      provider: 'elevenlabs'
    });

  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return NextResponse.json(
      { error: 'ElevenLabs TTS failed', fallback: true },
      { status: 500 }
    );
  }
}

// Google Cloud TTS
async function googleTTS(text: string, settings: Record<string, unknown> | undefined) {
  const apiKey = settings?.geminiApiKey as string | undefined;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'TTS service not configured' },
      { status: 503 }
    );
  }

  // Get voice from settings or use default
  const voiceName = (settings?.ttsVoice as string) || 'en-US-Neural2-F';

  // Call Google Cloud Text-to-Speech API
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
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

    const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || `TTS API error: ${response.status}`;

    return NextResponse.json(
      { error: errorMessage, fallback: true },
      { status: response.status }
    );
  }

  const data = await response.json();

  return NextResponse.json({
    audioContent: data.audioContent,
    contentType: 'audio/mp3',
    provider: 'google'
  });
}
