// AI Banner Generation Library using Google Gemini + DALL-E 3
// Generates professional, photo-realistic advertising banners from business information

import { scrapeWebsite, type ScrapedData } from '@/lib/webscraper';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Get Gemini API key from Firestore settings
 */
async function getGeminiApiKey(): Promise<string> {
  const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
  const settings = settingsDoc.data();
  const apiKey = settings?.geminiApiKey;

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please configure it in Admin settings.');
  }

  return apiKey;
}

/**
 * Get OpenAI API key from Firestore settings
 */
async function getOpenAIApiKey(): Promise<string> {
  const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
  const settings = settingsDoc.data();
  const apiKey = settings?.openaiApiKey;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please configure it in Admin settings.');
  }

  return apiKey;
}

export interface BusinessAnalysis {
  businessName: string;
  description: string;
  industry: string;
  colors: string[];
  logoUrl: string | null;
  keywords: string[];
  tagline?: string;
  source: 'url' | 'directory';
}

export interface BannerGenerationResult {
  imageUrl: string;
  imageData: string; // base64
  prompt: string;
  analysis: BusinessAnalysis;
}

/**
 * Analyze business from URL by scraping their website
 * @param url - Business website URL
 * @returns Business analysis data
 */
export async function analyzeBusinessFromUrl(url: string): Promise<BusinessAnalysis> {
  console.log('Analyzing business from URL:', url);

  const scraped = await scrapeWebsite(url);

  return {
    businessName: scraped.businessName,
    description: scraped.description,
    industry: scraped.industry,
    colors: scraped.colors,
    logoUrl: scraped.logoUrl,
    keywords: scraped.keywords,
    source: 'url',
  };
}

/**
 * Analyze business from directory listing in Firestore
 * @param businessId - Firestore business document ID
 * @returns Business analysis data
 */
export async function analyzeBusinessFromDirectory(businessId: string): Promise<BusinessAnalysis> {
  console.log('Analyzing business from directory:', businessId);

  const db = getDb();
  const businessRef = doc(db, 'businesses', businessId);
  const businessDoc = await getDoc(businessRef);

  if (!businessDoc.exists()) {
    throw new Error(`Business ${businessId} not found in directory`);
  }

  const business = businessDoc.data();

  return {
    businessName: business.name || 'Local Business',
    description: business.description || business.shortDescription || 'A trusted local business',
    industry: business.category || 'Local Business',
    colors: business.brandColors || ['#3b82f6', '#1e40af'],
    logoUrl: business.logo || business.images?.[0] || null,
    keywords: business.tags || [],
    tagline: business.tagline,
    source: 'directory',
  };
}

/**
 * Generate an advertising banner using Google Gemini + DALL-E 3
 * Step 1: Gemini analyzes business and creates detailed image prompt
 * Step 2: DALL-E 3 generates professional, photo-realistic banner
 * @param analysis - Business analysis data
 * @param regenerate - Whether this is a regeneration (adds variation)
 * @returns Generated banner image and prompt
 */
export async function generateBannerWithGemini(
  analysis: BusinessAnalysis,
  regenerate: boolean = false
): Promise<BannerGenerationResult> {
  // Get API key from Firestore settings (same as chat API)
  const apiKey = await getGeminiApiKey();
  const geminiModel = 'gemini-2.0-flash-exp';

  try {
    // Step 1: Use Gemini to create a detailed DALL-E 3 prompt with clever CTAs
    const businessPrompt = buildBannerPrompt(analysis, regenerate);
    console.log('Step 1 - Analyzing business with Gemini:', businessPrompt);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert advertising designer. Based on this business analysis, create a detailed prompt for DALL-E 3 to create a professional, photo-realistic 1024x1024px advertising banner.

${businessPrompt}

CRITICAL REQUIREMENTS FOR CALL-TO-ACTION:
- DO NOT use generic CTAs like "Click Here", "Learn More", or "Visit Us"
- Create a clever, industry-specific call-to-action that matches the business type
- Examples: Pizza restaurant → "Get the Best, Forget the Rest" | Real Estate → "Your Dream Home Awaits" | Spa → "Relax. Rejuvenate. Repeat."
- The CTA should integrate the business name and type naturally
- Use advertising copywriting techniques (rhyme, alliteration, emotional appeal)

Your prompt should describe:
1. Visual composition: Professional magazine-quality layout with clear text placement areas
2. Specific imagery: High-quality, relevant photos (e.g., "mouthwatering pizza with melted cheese", "modern luxury home exterior", "serene spa treatment room")
3. Color scheme: Use the provided brand colors tastefully
4. Typography: Professional, readable fonts with proper hierarchy
5. Design elements: Sophisticated styling (subtle gradients, professional shadows, elegant shapes)
6. Call-to-action: The clever, industry-specific CTA text and its prominent placement
7. Business identification: Business name clearly displayed, industry type evident from imagery

The result must look like a professional advertisement you'd see in a high-end magazine or AP-style news website - NOT a basic graphic with text on a colored background.

Output ONLY the DALL-E 3 prompt, no additional commentary.`
            }]
          }],
          generationConfig: {
            temperature: regenerate ? 0.9 : 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const dallePrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || businessPrompt;
    console.log('Step 2 - DALL-E 3 prompt generated:', dallePrompt);

    // Step 2: Generate professional banner with DALL-E 3
    console.log('Step 2 - Generating photo-realistic banner with DALL-E 3');

    try {
      const openaiApiKey = await getOpenAIApiKey();

      const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: dallePrompt.substring(0, 4000), // DALL-E 3 has 4000 char limit
          n: 1,
          size: '1024x1024', // Closest square format for banners
          quality: 'hd',
          style: 'vivid' // Vivid for eye-catching ads
        })
      });

      if (!dalleResponse.ok) {
        const errorData = await dalleResponse.json();
        console.error('DALL-E 3 API error:', errorData);
        throw new Error(`DALL-E 3 API error: ${dalleResponse.statusText}`);
      }

      const dalleData = await dalleResponse.json();
      const imageUrl = dalleData.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E 3');
      }

      console.log('DALL-E 3 image generated successfully');

      // Download the image and convert to base64 for immediate preview
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      const imageData = `data:image/png;base64,${base64}`;

      return {
        imageUrl,
        imageData,
        prompt: dallePrompt,
        analysis,
      };

    } catch (dalleError) {
      console.error('DALL-E 3 generation failed, falling back to enhanced SVG:', dalleError);

      // Fallback to enhanced SVG if DALL-E fails
      const imageData = generateEnhancedBanner(analysis, dallePrompt);

      return {
        imageUrl: '',
        imageData,
        prompt: dallePrompt,
        analysis,
      };
    }

  } catch (error) {
    console.error('Error generating banner with AI:', error);

    // Fallback to placeholder banner
    const businessPrompt = buildBannerPrompt(analysis, regenerate);
    const imageData = generatePlaceholderBanner(analysis);

    return {
      imageUrl: '',
      imageData,
      prompt: businessPrompt,
      analysis,
    };
  }
}

/**
 * Build the Gemini prompt for banner generation
 */
function buildBannerPrompt(analysis: BusinessAnalysis, regenerate: boolean): string {
  const variationText = regenerate ? ' Create a fresh, unique variation with different visual elements and layout.' : '';

  return `Create a professional advertising banner for this business:

Business Name: ${analysis.businessName}
Industry: ${analysis.industry}
Description: ${analysis.description}
Brand Colors: ${analysis.colors.join(', ')}
Keywords: ${analysis.keywords.join(', ')}
${analysis.tagline ? `Tagline: ${analysis.tagline}` : ''}

Requirements:
- Modern, eye-catching design
- Responsive layout that works for web banners (728x90, 300x250, 970x250)
- Incorporate the business name prominently
- Use the brand colors provided
- Include a clear call-to-action like "Learn More", "Visit Us", or "Call Today"
- Professional typography
- Clean, uncluttered layout
${variationText}

Generate a detailed visual description of the banner design, including:
- Layout and composition
- Color scheme and gradients
- Typography choices (font style, size, weight)
- Visual elements (icons, shapes, patterns)
- Call-to-action button design
- Overall mood and style`;
}

/**
 * Generate an enhanced SVG banner with professional design
 * Uses AI-generated prompt insights to create a better visual
 */
function generateEnhancedBanner(analysis: BusinessAnalysis, aiPrompt: string): string {
  const primaryColor = analysis.colors[0] || '#3b82f6';
  const secondaryColor = analysis.colors[1] || '#1e40af';
  const accentColor = analysis.colors[2] || '#60a5fa';

  // Escape XML special characters
  const escapeName = (analysis.businessName || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });

  const escapeTagline = (analysis.tagline || analysis.industry || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });

  // Create enhanced SVG banner with modern design
  const svg = `
<svg width="970" height="250" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0.1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="970" height="250" fill="url(#bgGradient)"/>

  <!-- Decorative elements -->
  <circle cx="850" cy="125" r="120" fill="white" opacity="0.08"/>
  <circle cx="850" cy="125" r="80" fill="white" opacity="0.05"/>
  <rect x="0" y="0" width="970" height="80" fill="url(#accentGradient)"/>

  <!-- Accent bar -->
  <rect x="0" y="245" width="970" height="5" fill="${accentColor}" opacity="0.6"/>

  <!-- Business Name -->
  <text x="60" y="110" font-family="'Helvetica Neue', Arial, sans-serif" font-size="56" font-weight="bold"
        fill="white" filter="url(#shadow)">
    ${escapeName}
  </text>

  <!-- Tagline/Industry -->
  <text x="60" y="155" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22"
        fill="white" opacity="0.95">
    ${escapeTagline}
  </text>

  <!-- Call to Action Button -->
  <rect x="60" y="180" width="200" height="50" rx="25" fill="white" opacity="0.95" filter="url(#shadow)"/>
  <text x="160" y="212" font-family="'Helvetica Neue', Arial, sans-serif" font-size="18" font-weight="600"
        fill="${primaryColor}" text-anchor="middle">
    Learn More →
  </text>

  <!-- Decorative corner accent -->
  <path d="M 900 0 L 970 0 L 970 70 Z" fill="${accentColor}" opacity="0.15"/>
</svg>`;

  // Convert SVG to base64
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate a placeholder banner (simple fallback)
 * Creates an SVG banner with the business information
 */
function generatePlaceholderBanner(analysis: BusinessAnalysis): string {
  return generateEnhancedBanner(analysis, '');
}

/**
 * Upload generated banner to Firebase Storage
 * @param imageData - Base64 encoded image data
 * @param advertiserId - Advertiser ID for file naming
 * @returns Download URL from Firebase Storage
 */
export async function uploadBannerToStorage(
  imageData: string,
  advertiserId: string
): Promise<string> {
  const storage = getStorage();
  const timestamp = Date.now();
  const filename = `advertisers/${advertiserId}/banner-${timestamp}.png`;
  const storageRef = ref(storage, filename);

  // Upload the base64 image
  await uploadString(storageRef, imageData, 'data_url');

  // Get the download URL
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
