/**
 * Unified AI Image Generation Service
 * Used by ALL article creation methods to ensure consistency
 */

import { storageService } from '@/lib/storage';
import { API_PRICING } from '@/lib/costs';

export interface ImageGenerationOptions {
  geminiApiKey: string;
  title: string;
  size?: '1792x1024' | '1024x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
  // Custom prompt text appended to the base prompt (for manual generation)
  customPrompt?: string;
  // Legacy support for existing code
  openaiApiKey?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  cost?: number; // Cost in USD
  source?: 'gemini' | 'dalle' | 'unsplash' | 'pexels'; // Where the image came from
  metadata?: {
    generatedAt: string;
    model: string;
    size: string;
    prompt: string;
  };
}

/**
 * Generate an AI image using Gemini 3 Pro Image for an article
 * This ensures we only use legally owned images, never copyrighted news photos
 *
 * @param options - Image generation configuration
 * @returns Promise<ImageGenerationResult>
 */
export async function generateArticleImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const {
    geminiApiKey,
    title,
    size = '1792x1024',
    customPrompt,
  } = options;

  // Validate API key
  if (!geminiApiKey || geminiApiKey.trim() === '') {
    console.warn('[ImageGen] No Gemini API key provided - skipping image generation');
    return {
      success: false,
      error: 'Gemini API key not configured',
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
    // Build AP-style news photo prompt optimized for Gemini 3 Pro Image
    let imagePrompt = `Create a professional news photograph for this headline: "${title}"

Requirements:
- Photorealistic editorial photography style
- High resolution, sharp focus, natural lighting
- Clean composition suitable for newspaper front page
- No text overlays, watermarks, or logos
- No recognizable human faces (use back views, silhouettes, or crowds from distance)
- Conveys the story visually without relying on text
- Professional photojournalism quality`;

    // Append custom prompt if provided (for manual generation with specific requirements)
    if (customPrompt && customPrompt.trim()) {
      imagePrompt += `\n\nAdditional requirements: ${customPrompt.trim()}`;
      console.log('[ImageGen] Custom prompt added:', customPrompt.substring(0, 50) + '...');
    }

    console.log('[ImageGen] Generating AI image with Gemini 3 Pro for:', title.substring(0, 50) + '...');

    // Call Gemini 3 Pro Image API (highest quality, 4K output)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: imagePrompt }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: '16:9',
              imageSize: '2K'
            }
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('[ImageGen] Gemini API error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    // Extract image from Gemini response (base64 encoded)
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart?.inlineData?.data) {
      console.error('[ImageGen] Gemini returned no image data');
      return {
        success: false,
        error: 'No image returned from Gemini',
      };
    }

    // Convert base64 to blob and upload to Firebase Storage
    console.log('[ImageGen] Persisting Gemini image to Firebase Storage...');
    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    // Create a data URL and upload
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    const persistedUrl = await storageService.uploadAssetFromDataUrl(dataUrl);

    console.log('[ImageGen] ✅ Gemini image generated and persisted successfully');
    console.log('[ImageGen] URL:', persistedUrl.substring(0, 80) + '...');

    // Gemini 3 Pro Image cost estimate
    const imageCost = 0.05;

    return {
      success: true,
      imageUrl: persistedUrl,
      cost: imageCost,
      source: 'gemini',
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-3-pro-image-preview',
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
 * Helper: Check if Gemini API key is configured for image generation
 * Use this before calling generateArticleImage to provide better UX
 */
export function isImageGenerationAvailable(geminiApiKey?: string): boolean {
  return Boolean(geminiApiKey && geminiApiKey.trim() !== '');
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
