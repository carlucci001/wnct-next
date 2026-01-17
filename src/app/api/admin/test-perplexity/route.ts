import { NextRequest, NextResponse } from 'next/server';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

/**
 * Tests Perplexity API key validity
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
    let PERPLEXITY_API_KEY = providedKey;

    if (!PERPLEXITY_API_KEY) {
      // Fallback to Firebase settings
      const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        PERPLEXITY_API_KEY = settings.perplexityApiKey;
      }
    }

    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: 'No API key provided' },
        { status: 400 }
      );
    }

    // Test the API key with a minimal request
    // Try the most basic sonar model first (should work with all API keys)
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Most basic model, should work with all API keys
        messages: [
          {
            role: 'user',
            content: 'Test query: What is 2+2?'
          }
        ],
        max_tokens: 10
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Perplexity Test] API error:', response.status, data);

      // Provide detailed error message
      let errorMessage = 'API Key Invalid';
      let errorDetails = data.error?.message || 'Unknown error';

      // Check for common error types
      if (data.error?.type === 'invalid_model_requested') {
        errorMessage = 'Model Access Issue';
        errorDetails = `Your API key doesn't have access to the 'sonar-pro' model. Available models for your key: ${data.error?.param || 'check Perplexity dashboard'}`;
      } else if (response.status === 401) {
        errorMessage = 'API Key Invalid';
        errorDetails = 'The API key is not valid. Please check that you copied it correctly from Perplexity.';
      } else if (response.status === 403) {
        errorMessage = 'API Key Forbidden';
        errorDetails = 'Access forbidden. Your API key may not have the required permissions.';
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
      message: 'API Key Valid! Perplexity web search is ready.',
      model: data.model || 'sonar-pro'
    });

  } catch (error: any) {
    console.error('[Perplexity Test] Error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}
