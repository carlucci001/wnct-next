/**
 * Unified AI Image Generation Service
 * Used by ALL article creation methods to ensure consistency
 */

import { storageService } from '@/lib/storage';

export interface ImageGenerationOptions {
  openaiApiKey: string;
  title: string;
  size?: '1792x1024' | '1024x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    generatedAt: string;
    model: string;
    size: string;
    prompt: string;
  };
}

/**
 * Generate an AI image using DALL-E for an article
 * This ensures we only use legally owned images, never copyrighted news photos
 *
 * @param options - Image generation configuration
 * @returns Promise<ImageGenerationResult>
 */
export async function generateArticleImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const {
    openaiApiKey,
    title,
    size = '1792x1024',
    quality = 'hd',
    style = 'natural',
  } = options;

  // Validate API key
  if (!openaiApiKey || openaiApiKey.trim() === '') {
    console.warn('[ImageGen] No OpenAI API key provided - skipping image generation');
    return {
      success: false,
      error: 'OpenAI API key not configured',
    };
  }

  // Validate title
  if (!title || title.trim() === '') {
    return {
      success: false,
      error: 'Article title is required for image generation',
    };
  }

  try {
    // Build AP-style news photo prompt
    const imagePrompt = `A photorealistic news photograph depicting: ${title}. Professional editorial photography style, high resolution, natural lighting, clean composition without any text overlay or watermarks.`;

    console.log('[ImageGen] Generating AI image for:', title.substring(0, 50) + '...');

    // Call DALL-E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt.substring(0, 1000), // DALL-E 3 max prompt length
        n: 1,
        size,
        quality,
        style,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('[ImageGen] DALL-E API error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    const tempImageUrl = data.data?.[0]?.url;

    if (!tempImageUrl) {
      console.error('[ImageGen] DALL-E returned no image URL');
      return {
        success: false,
        error: 'No image URL returned from DALL-E',
      };
    }

    // Persist the temporary DALL-E URL to Firebase Storage
    console.log('[ImageGen] Persisting temporary image to Firebase Storage...');
    const persistedUrl = await storageService.uploadAssetFromUrl(tempImageUrl);

    console.log('[ImageGen] ✅ AI image generated and persisted successfully');
    console.log('[ImageGen] URL:', persistedUrl.substring(0, 80) + '...');

    return {
      success: true,
      imageUrl: persistedUrl,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'dall-e-3',
        size,
        prompt: imagePrompt.substring(0, 200),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ImageGen] Failed to generate AI image:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Helper: Check if OpenAI API key is configured
 * Use this before calling generateArticleImage to provide better UX
 */
export function isImageGenerationAvailable(openaiApiKey?: string): boolean {
  return Boolean(openaiApiKey && openaiApiKey.trim() !== '');
}

/**
 * Extract visual elements from article content using Gemini
 * Returns specific, photographable elements for better image generation
 */
export async function extractVisualElements(
  title: string,
  content: string,
  category: string,
  geminiApiKey: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this news article and extract specific visual elements for a news photograph.

Article Title: ${title}
Category: ${category}
Content Preview: ${content.substring(0, 500)}

Task: Identify 2-3 concrete, photographable elements from this article.

Examples of GOOD elements:
- "A brick building with white columns" (specific architecture)
- "A person wearing a business suit shaking hands" (specific action)
- "Mountains in the background with fog" (specific scene)

Examples of BAD elements:
- "Success" (abstract concept)
- "Community" (too vague)
- "The city council" (organization, not visual)

Respond with ONLY 2-3 specific visual elements, comma-separated, that could appear in an AP-style news photograph. Focus on physical objects, locations, and actions.`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 100
          }
        })
      }
    );

    if (!response.ok) {
      console.log('[VisualExtract] Gemini API error:', response.status);
      return null;
    }

    const data = await response.json();
    const visualElements = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return visualElements || null;
  } catch (error) {
    console.error('[VisualExtract] Failed to extract visual elements:', error);
    return null;
  }
}

/**
 * Build a detailed DALL-E prompt with AP-style guidelines
 */
export function buildDetailedImagePrompt(
  title: string,
  visualElements?: string,
  category?: string
): string {
  const timeOfDay = ['at dawn', 'in morning light', 'at golden hour', 'in afternoon light', 'at dusk'];
  const weather = ['on a clear day', 'with blue sky', 'with soft overcast sky', 'with dramatic clouds'];

  const randomTime = timeOfDay[Math.floor(Math.random() * timeOfDay.length)];
  const randomWeather = weather[Math.floor(Math.random() * weather.length)];

  let prompt = 'A professional AP-style news photograph';

  if (category) {
    prompt += ` for ${category} news story`;
  }

  prompt += '.\n\n';

  if (visualElements) {
    prompt += `Visual Elements: ${visualElements}\n\n`;
  } else {
    prompt += `Subject: ${title}\n\n`;
  }

  prompt += `Photography Requirements:
- Professional editorial photojournalism style
- High resolution, sharp focus
- Natural lighting (${randomTime}, ${randomWeather})
- Rule of thirds composition
- Shallow depth of field (subject in focus, background slightly blurred)
- Neutral color grading (realistic, not oversaturated)
- NO text, NO watermarks, NO logos, NO signs with readable text
- NO people's faces (to avoid AI bias and likeness issues)
- Clean, uncluttered composition
- Conveys the story visually without relying on text

Technical specs: Canon EOS R5, 50mm lens, f/2.8, natural light, photorealistic`;

  return prompt;
}
