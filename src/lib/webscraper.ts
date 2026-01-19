// Web Scraper Library for Business Analysis
// Extracts business information from URLs for AI banner generation

export interface ScrapedData {
  businessName: string;
  description: string;
  colors: string[];
  logoUrl: string | null;
  industry: string;
  keywords: string[];
  html: string;
}

/**
 * Scrape a website to extract business information
 * @param url - Website URL to scrape
 * @returns Scraped business data
 */
export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  try {
    // Ensure URL has protocol
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // Fetch the website HTML
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract business information
    const businessName = extractBusinessName(html, normalizedUrl);
    const description = extractDescription(html);
    const colors = extractColors(html);
    const logoUrl = await extractLogo(normalizedUrl, html);
    const industry = inferIndustry(html);
    const keywords = extractKeywords(html);

    return {
      businessName,
      description,
      colors,
      logoUrl,
      industry,
      keywords,
      html,
    };
  } catch (error) {
    console.error('Error scraping website:', error);
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract business name from HTML
 */
function extractBusinessName(html: string, url: string): string {
  // Try Open Graph title
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogTitle) return ogTitle[1];

  // Try page title
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) return title[1].replace(/\s*[-|]\s*.*$/, ''); // Remove taglines

  // Try h1 tag
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return h1[1];

  // Fallback to domain name
  const domain = new URL(url).hostname.replace('www.', '');
  return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

/**
 * Extract business description from HTML
 */
function extractDescription(html: string): string {
  // Try Open Graph description
  const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  if (ogDesc) return ogDesc[1];

  // Try meta description
  const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (metaDesc) return metaDesc[1];

  // Try first paragraph
  const firstP = html.match(/<p[^>]*>([^<]{50,200})<\/p>/i);
  if (firstP) return firstP[1];

  return 'A local business serving the community';
}

/**
 * Extract brand colors from HTML
 * @param html - HTML content
 * @returns Array of hex color codes
 */
export function extractColors(html: string): string[] {
  const colors = new Set<string>();

  // Extract from inline styles
  const inlineColors = html.match(/(?:color|background|background-color):\s*#([0-9a-f]{6}|[0-9a-f]{3})/gi);
  if (inlineColors) {
    inlineColors.forEach((match) => {
      const hex = match.match(/#([0-9a-f]{6}|[0-9a-f]{3})/i)?.[1];
      if (hex) colors.add(`#${hex.toLowerCase()}`);
    });
  }

  // Extract from CSS color values
  const rgbColors = html.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi);
  if (rgbColors) {
    rgbColors.slice(0, 5).forEach((rgb) => {
      const matches = rgb.match(/\d+/g);
      if (matches && matches.length === 3) {
        const [r, g, b] = matches.map(Number);
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colors.add(hex);
      }
    });
  }

  // If no colors found, return default blue
  if (colors.size === 0) {
    return ['#3b82f6', '#1e40af'];
  }

  return Array.from(colors).slice(0, 3);
}

/**
 * Extract logo URL from HTML
 */
export async function extractLogo(url: string, html: string): Promise<string | null> {
  // Try Open Graph image
  const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (ogImage) return makeAbsoluteUrl(ogImage[1], url);

  // Try favicon
  const favicon = html.match(/<link[^>]*rel="(?:icon|shortcut icon)"[^>]*href="([^"]+)"/i);
  if (favicon) return makeAbsoluteUrl(favicon[1], url);

  // Try common logo patterns
  const logoPatterns = [
    /<img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*logo[^"]*)"/i,
    /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
  ];

  for (const pattern of logoPatterns) {
    const match = html.match(pattern);
    if (match) return makeAbsoluteUrl(match[1], url);
  }

  return null;
}

/**
 * Infer industry from HTML content
 */
function inferIndustry(html: string): string {
  const lowerHtml = html.toLowerCase();

  const industries = [
    { keywords: ['restaurant', 'dining', 'menu', 'cuisine', 'food'], name: 'Restaurant' },
    { keywords: ['retail', 'shop', 'store', 'boutique', 'sale'], name: 'Retail' },
    { keywords: ['lawyer', 'attorney', 'legal', 'law firm'], name: 'Legal Services' },
    { keywords: ['doctor', 'medical', 'clinic', 'health', 'dental'], name: 'Healthcare' },
    { keywords: ['salon', 'spa', 'beauty', 'hair', 'nails'], name: 'Beauty & Wellness' },
    { keywords: ['realtor', 'real estate', 'property', 'homes'], name: 'Real Estate' },
    { keywords: ['auto', 'car', 'vehicle', 'repair', 'mechanic'], name: 'Automotive' },
    { keywords: ['insurance', 'policy', 'coverage'], name: 'Insurance' },
    { keywords: ['contractor', 'construction', 'remodel', 'builder'], name: 'Construction' },
  ];

  for (const industry of industries) {
    if (industry.keywords.some(keyword => lowerHtml.includes(keyword))) {
      return industry.name;
    }
  }

  return 'Local Business';
}

/**
 * Extract keywords from HTML
 */
function extractKeywords(html: string): string[] {
  // Try meta keywords
  const metaKeywords = html.match(/<meta\s+name="keywords"\s+content="([^"]+)"/i);
  if (metaKeywords) {
    return metaKeywords[1].split(',').map(k => k.trim()).slice(0, 5);
  }

  // Extract from title and description
  const keywords: string[] = [];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) {
    keywords.push(...title[1].split(/\s+/).filter(w => w.length > 3).slice(0, 3));
  }

  return keywords.length > 0 ? keywords : ['quality', 'service', 'local'];
}

/**
 * Convert relative URL to absolute
 */
function makeAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}
