/**
 * Stock Photo Integration for News Articles
 * Searches Unsplash and Pexels for relevant, high-quality images
 */

import { API_PRICING } from '@/lib/costs';

export interface StockPhoto {
  url: string;
  attribution: string;
  photographer: string;
  source: 'unsplash' | 'pexels';
  cost: number; // Always $0 for free tier
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
    // Use specific keywords without generic "news" terms
    // The keywords should already be extracted from article content
    const searchQuery = query;

    console.log(`[Unsplash] Searching for: "${searchQuery}"`);

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=10&orientation=landscape`,
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

    // Randomly select from available results to get variety on regenerate
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const photo = data.results[randomIndex];
    console.log(`[Unsplash] Selected photo ${randomIndex + 1} of ${data.results.length}`);

    return {
      url: photo.urls.regular, // 1080px width
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      photographer: photo.user.name,
      source: 'unsplash',
      cost: API_PRICING.UNSPLASH_FREE
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
 * @param apiKey - Pexels API key (from Firestore settings)
 * @returns Photo URL with attribution, or null if not found
 */
export async function searchPexelsPhoto(
  query: string,
  category?: string,
  apiKey?: string
): Promise<StockPhoto | null> {
  const PEXELS_API_KEY = apiKey || process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY) {
    console.log('[Pexels] API key not configured');
    return null;
  }

  try {
    // Use specific keywords without generic category terms
    const searchQuery = query;

    console.log(`[Pexels] Searching for: "${searchQuery}"`);

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=10&orientation=landscape`,
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

    // Randomly select from available results to get variety on regenerate
    const randomIndex = Math.floor(Math.random() * data.photos.length);
    const photo = data.photos[randomIndex];
    console.log(`[Pexels] Selected photo ${randomIndex + 1} of ${data.photos.length}`);

    return {
      url: photo.src.large, // 940px width
      attribution: `Photo by ${photo.photographer} from Pexels`,
      photographer: photo.photographer,
      source: 'pexels',
      cost: API_PRICING.PEXELS_FREE
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
 * @param pexelsApiKey - Pexels API key (from Firestore settings)
 * @returns Photo or null if none found
 */
export async function findStockPhoto(
  query: string,
  category?: string,
  pexelsApiKey?: string
): Promise<StockPhoto | null> {
  // Try Unsplash first (higher quality, better curation)
  const unsplashPhoto = await searchUnsplashPhoto(query, category);
  if (unsplashPhoto) {
    console.log(`[StockPhoto] Found on Unsplash: ${query}`);
    return unsplashPhoto;
  }

  // Fallback to Pexels
  const pexelsPhoto = await searchPexelsPhoto(query, category, pexelsApiKey);
  if (pexelsPhoto) {
    console.log(`[StockPhoto] Found on Pexels: ${query}`);
    return pexelsPhoto;
  }

  console.log(`[StockPhoto] No stock photos found for: ${query}`);
  return null;
}

/**
 * Extract keywords from article title and content for stock photo search
 * @param title - Article title
 * @param content - Article content (optional, for better context)
 * @returns Clean search query with specific visual terms
 */
export function extractPhotoKeywords(title: string, content?: string): string {
  // Common words to filter out
  const stopWords = [
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but',
    'says', 'after', 'new', 'will', 'has', 'have', 'been', 'was', 'were', 'is',
    'are', 'this', 'that', 'these', 'those', 'their', 'them', 'they', 'from',
    'with', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'more',
    'most', 'other', 'some', 'such', 'than', 'too', 'very', 'can', 'just',
    'should', 'now', 'news', 'editorial', 'article', 'story', 'report'
  ];

  // Collect all words from title and content
  const allText = content
    ? `${title} ${content.replace(/<[^>]*>/g, '')}` // Strip HTML tags
    : title;

  // Extract all meaningful words (nouns, proper nouns, visual terms)
  const words = allText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word =>
      word.length > 3 &&
      !stopWords.includes(word) &&
      !/^\d+$/.test(word) // Filter out pure numbers
    );

  // Count word frequency to find most important terms
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Prioritize words that appear in the title
  const titleWords = new Set(
    title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.includes(w))
  );

  // Sort by: title words first, then by frequency
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => {
      const aInTitle = titleWords.has(a[0]) ? 1000 : 0;
      const bInTitle = titleWords.has(b[0]) ? 1000 : 0;
      return (bInTitle + b[1]) - (aInTitle + a[1]);
    })
    .map(([word]) => word);

  // Take top 4-5 most relevant keywords
  const keywords = sortedWords.slice(0, 5).join(' ');

  // Fallback to just title words if extraction failed
  return keywords || title.split(' ').slice(0, 3).join(' ');
}
