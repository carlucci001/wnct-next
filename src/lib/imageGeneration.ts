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
