/**
 * Stock Photo Integration for News Articles
 * Searches Unsplash and Pexels for relevant, high-quality images
 */

export interface StockPhoto {
  url: string;
  attribution: string;
  photographer: string;
  source: 'unsplash' | 'pexels';
}

/**
 * Searches Unsplash for relevant stock photos
 * @param query - Search query (article keywords)
 * @param category - Article category for context
 * @returns Photo URL with attribution, or null if not found
 */
export async function searchUnsplashPhoto(
  query: string,
  category?: string
): Promise<StockPhoto | null> {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

  if (!UNSPLASH_ACCESS_KEY) {
    console.log('[Unsplash] API key not configured');
    return null;
  }

  try {
    // Add category to refine search
    const searchQuery = category
      ? `${query} ${category} news editorial`
      : `${query} news editorial`;

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.log(`[Unsplash] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log(`[Unsplash] No results for query: ${searchQuery}`);
      return null;
    }

    // Return first high-quality result
    const photo = data.results[0];
    return {
      url: photo.urls.regular, // 1080px width
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      photographer: photo.user.name,
      source: 'unsplash'
    };
  } catch (error) {
    console.error('[Unsplash] Search failed:', error);
    return null;
  }
}

/**
 * Searches Pexels for relevant stock photos (fallback if Unsplash fails)
 * @param query - Search query (article keywords)
 * @param category - Article category for context
 * @returns Photo URL with attribution, or null if not found
 */
export async function searchPexelsPhoto(
  query: string,
  category?: string
): Promise<StockPhoto | null> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY) {
    console.log('[Pexels] API key not configured');
    return null;
  }

  try {
    const searchQuery = category
      ? `${query} ${category} journalism`
      : `${query} journalism`;

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      console.log(`[Pexels] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      console.log(`[Pexels] No results for query: ${searchQuery}`);
      return null;
    }

    const photo = data.photos[0];
    return {
      url: photo.src.large, // 940px width
      attribution: `Photo by ${photo.photographer} from Pexels`,
      photographer: photo.photographer,
      source: 'pexels'
    };
  } catch (error) {
    console.error('[Pexels] Search failed:', error);
    return null;
  }
}

/**
 * Search for a stock photo using both services (Unsplash first, then Pexels)
 * @param query - Search query extracted from article
 * @param category - Article category
 * @returns Photo or null if none found
 */
export async function findStockPhoto(
  query: string,
  category?: string
): Promise<StockPhoto | null> {
  // Try Unsplash first (higher quality, better curation)
  const unsplashPhoto = await searchUnsplashPhoto(query, category);
  if (unsplashPhoto) {
    console.log(`[StockPhoto] Found on Unsplash: ${query}`);
    return unsplashPhoto;
  }

  // Fallback to Pexels
  const pexelsPhoto = await searchPexelsPhoto(query, category);
  if (pexelsPhoto) {
    console.log(`[StockPhoto] Found on Pexels: ${query}`);
    return pexelsPhoto;
  }

  console.log(`[StockPhoto] No stock photos found for: ${query}`);
  return null;
}

/**
 * Extract keywords from article title for stock photo search
 * @param title - Article title
 * @returns Clean search query
 */
export function extractPhotoKeywords(title: string): string {
  // Remove common news words and extract meaningful terms
  const stopWords = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'says', 'after', 'new'];

  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(' ')
    .filter(word => word.length > 4 && !stopWords.includes(word))
    .slice(0, 3); // Take first 3 meaningful words

  return words.join(' ') || title.split(' ').slice(0, 3).join(' ');
}
