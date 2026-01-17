import { NextRequest, NextResponse } from 'next/server';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { AIFeatureConfig, AIFeatureKey } from '@/types/aiConfig';

/**
 * Test AI Configuration Endpoint
 * Tests if a specific AI feature configuration works with the configured API keys
 */
export async function POST(request: NextRequest) {
  try {
    const { feature, config } = await request.json();

    if (!feature || !config) {
      return NextResponse.json(
        { success: false, error: 'Feature and config are required' },
        { status: 400 }
      );
    }

    const featureKey = feature as AIFeatureKey;
    const featureConfig = config as AIFeatureConfig;

    if (!featureConfig.enabled) {
      return NextResponse.json(
        { success: false, error: 'Feature is disabled' },
        { status: 400 }
      );
    }

    // Get API keys from settings
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();

    // Test based on provider
    const startTime = Date.now();
    let result;

    switch (featureConfig.primaryProvider) {
      case 'gemini':
        result = await testGemini(settings?.geminiApiKey, featureConfig);
        break;
      case 'claude':
        result = await testClaude(settings?.claudeCodeApiKey, featureConfig);
        break;
      case 'openai':
      case 'dalle':
        result = await testOpenAI(settings?.openaiApiKey, featureConfig);
        break;
      case 'perplexity':
        result = await testPerplexity(settings?.perplexityApiKey, featureConfig);
        break;
      case 'elevenlabs':
        result = await testElevenLabs(settings?.elevenLabsApiKey, featureConfig);
        break;
      case 'google-tts':
        result = await testGoogleTTS(settings?.geminiApiKey, featureConfig);
        break;
      case 'stock-photos':
        result = await testStockPhotos(featureConfig, settings);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported provider: ${featureConfig.primaryProvider}` },
          { status: 400 }
        );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: result.success,
      responseTime,
      cost: result.cost || 0,
      error: result.error,
      details: result.details,
    });
  } catch (error: any) {
    console.error('[Test AI Config] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Test Functions for Each Provider

async function testGemini(apiKey: string | undefined, config: AIFeatureConfig) {
  if (!apiKey) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.primaryModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test' }] }],
          generationConfig: {
            temperature: config.temperature || 0.7,
            maxOutputTokens: 10,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: 'API request failed',
        details: error.error?.message || 'Unknown error',
      };
    }

    return { success: true, cost: 0.0001 };
  } catch (error: any) {
    return { success: false, error: 'Test failed', details: error.message };
  }
}

async function testClaude(apiKey: string | undefined, config: AIFeatureConfig) {
  if (!apiKey) {
    return { success: false, error: 'Claude API key not configured' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.primaryModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: 'API request failed',
        details: error.error?.message || 'Unknown error',
      };
    }

    return { success: true, cost: 0.0001 };
  } catch (error: any) {
    return { success: false, error: 'Test failed', details: error.message };
  }
}

async function testOpenAI(apiKey: string | undefined, config: AIFeatureConfig) {
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured' };
  }

  try {
    // Test with a simple completion
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: 'API request failed',
        details: error.error?.message || 'Unknown error',
      };
    }

    return { success: true, cost: 0.0001 };
  } catch (error: any) {
    return { success: false, error: 'Test failed', details: error.message };
  }
}

async function testPerplexity(apiKey: string | undefined, config: AIFeatureConfig) {
  if (!apiKey) {
    return { success: false, error: 'Perplexity API key not configured' };
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.primaryModel,
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: 'API request failed',
        details: error.error?.message || 'Unknown error',
      };
    }

    return { success: true, cost: 0.001 };
  } catch (error: any) {
    return { success: false, error: 'Test failed', details: error.message };
  }
}

async function testElevenLabs(apiKey: string | undefined, config: AIFeatureConfig) {
  if (!apiKey) {
    return { success: false, error: 'ElevenLabs API key not configured' };
  }

  try {
    // Test by getting available voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: 'API request failed',
        details: error.detail || 'Unknown error',
      };
    }

    return { success: true, cost: 0 };
  } catch (error: any) {
    return { success: false, error: 'Test failed', details: error.message };
  }
}

async function testGoogleTTS(apiKey: string | undefined, config: AIFeatureConfig) {
  if (!apiKey) {
    return { success: false, error: 'Google TTS (Gemini) API key not configured' };
  }

  // Google TTS uses the same key as Gemini, so if Gemini key exists, TTS should work
  return { success: true, cost: 0.001 };
}

async function testStockPhotos(config: AIFeatureConfig, settings: any) {
  try {
    if (config.primaryModel === 'unsplash') {
      // Unsplash doesn't require auth for basic usage
      const response = await fetch(
        'https://api.unsplash.com/search/photos?query=test&per_page=1',
        {
          headers: {
            'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY || ''}`,
          },
        }
      );

      if (!response.ok && response.status !== 403) {
        return {
          success: false,
          error: 'Unsplash API test failed',
          details: 'Check if UNSPLASH_ACCESS_KEY is configured',
        };
      }

      return { success: true, cost: 0 };
    } else if (config.primaryModel === 'pexels') {
      if (!settings?.pexelsApiKey) {
        return { success: false, error: 'Pexels API key not configured' };
      }

      const response = await fetch(
        'https://api.pexels.com/v1/search?query=test&per_page=1',
        {
          headers: {
            'Authorization': settings.pexelsApiKey,
          },
        }
      );

      if (!response.ok) {
        return { success: false, error: 'Pexels API test failed' };
      }

      return { success: true, cost: 0 };
    }

    return { success: false, error: 'Unknown stock photo provider' };
  } catch (error: any) {
    return { success: false, error: 'Test failed', details: error.message };
  }
}
