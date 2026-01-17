import { NextRequest, NextResponse } from 'next/server';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

/**
 * Tests Claude Code API key validity
 * Called from Admin UI to verify API key works
 */
export async function POST(request: NextRequest) {
  try {
    // Parse JSON body with error handling
    let providedKey;
    try {
      const body = await request.json();
      providedKey = body.apiKey;
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body - expected JSON with apiKey field' },
        { status: 400 }
      );
    }

    // Get API key from either request body or Firebase settings
    let CLAUDE_API_KEY = providedKey;

    if (!CLAUDE_API_KEY) {
      // Fallback to Firebase settings
      const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        CLAUDE_API_KEY = settings.claudeCodeApiKey;
      }
    }

    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'No API key provided' },
        { status: 400 }
      );
    }

    // Test the API key with a minimal request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Test'
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Claude Test] API error:', response.status, data);

      // Provide detailed error message
      let errorMessage = 'API Key Invalid';
      let errorDetails = data.error?.message || 'Unknown error';

      // Check for common error types
      if (data.error?.type === 'authentication_error') {
        errorMessage = 'Authentication Error';
        errorDetails = 'The API key is not valid. Please check that you copied it correctly from the Anthropic Console.';
      } else if (response.status === 401) {
        errorMessage = 'API Key Invalid';
        errorDetails = 'The API key is not valid. Please check your Anthropic API key.';
      } else if (response.status === 403) {
        errorMessage = 'API Key Forbidden';
        errorDetails = 'Access forbidden. Your API key may not have the required permissions.';
      } else if (data.error?.type === 'permission_error') {
        errorMessage = 'Permission Error';
        errorDetails = 'Your API key does not have permission to access this model.';
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          status: response.status,
          fullError: data // Include full error for debugging
        },
        { status: response.status }
      );
    }

    // API key is valid
    return NextResponse.json({
      success: true,
      message: 'API Key Valid! Claude Code services are ready.',
      model: data.model || 'claude-3-5-sonnet-20241022'
    });

  } catch (error: any) {
    console.error('[Claude Test] Error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}
