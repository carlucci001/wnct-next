import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

type GenerateType = 'metaDescription' | 'imageAltText' | 'hashtags' | 'all';

interface GenerateMetadataRequest {
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
  authorName?: string;
  generateTypes: GenerateType[];
}

interface GeneratedMetadata {
  metaDescription?: string;
  imageAltText?: string;
  hashtags?: string[];
  keywords?: string[];
  localKeywords?: string[];
  geoTags?: string[];
  entities?: {
    people: string[];
    organizations: string[];
    locations: string[];
    topics: string[];
  };
  schema?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[SEO API] Starting generate-metadata request');

    let body: GenerateMetadataRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[SEO API] Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, content, category, authorName, generateTypes } = body;
    console.log('[SEO API] Request body parsed:', { title: title?.substring(0, 50), hasContent: !!content, category, generateTypes });

    if (!title || !content) {
      console.log('[SEO API] Missing title or content');
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    if (!generateTypes || generateTypes.length === 0) {
      console.log('[SEO API] Missing generateTypes');
      return NextResponse.json(
        { error: 'At least one generate type is required' },
        { status: 400 }
      );
    }

    // Get settings from Firestore
    console.log('[SEO API] Fetching settings from Firestore...');
    let settings;
    try {
      const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
      settings = settingsDoc.data();
    } catch (firestoreError) {
      console.error('[SEO API] Firestore error:', firestoreError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    console.log('[SEO API] Settings fetched, hasGeminiKey:', !!settings?.geminiApiKey);

    const apiKey = settings?.geminiApiKey;
    if (!apiKey) {
      console.log('[SEO API] No Gemini API key configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please configure the Gemini API key in Admin settings.' },
        { status: 503 }
      );
    }

    const model = 'gemini-2.0-flash';

    // Check if generating all SEO fields
    const generateAll = generateTypes.includes('all');

    if (generateAll) {
      // Generate comprehensive SEO metadata in one call
      console.log('[SEO API] Calling generateAllSEOMetadata...');
      const metadata = await generateAllSEOMetadata(apiKey, model, title, content, category, authorName);
      console.log('[SEO API] SEO metadata generated successfully');
      return NextResponse.json({ success: true, metadata });
    }

    // Legacy: Build the prompt based on what needs to be generated
    const prompt = buildMetadataPrompt(title, content, category, generateTypes);

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate metadata' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the generated response
    const metadata = parseMetadataResponse(generatedText, generateTypes);

    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[SEO API] Unhandled error:', errorMessage);
    console.error('[SEO API] Stack:', errorStack);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Generate all SEO metadata in a single API call
 */
async function generateAllSEOMetadata(
  apiKey: string,
  model: string,
  title: string,
  content: string,
  category?: string,
  authorName?: string
): Promise<GeneratedMetadata> {
  const plainContent = content.replace(/<[^>]+>/g, '').trim();
  const truncatedContent = plainContent.length > 2000
    ? plainContent.substring(0, 2000) + '...'
    : plainContent;

  const publishedAt = new Date().toISOString();
  const categoryName = category || 'News';
  const author = authorName || 'Staff Writer';

  const prompt = `You are an SEO expert. Analyze this news article and generate comprehensive SEO metadata.

ARTICLE TITLE: ${title}
CATEGORY: ${categoryName}

ARTICLE CONTENT:
${truncatedContent}

Generate SEO metadata in EXACTLY this JSON format (no markdown, just raw JSON):

{
  "metaDescription": "A compelling 150-155 character description that summarizes the article and encourages clicks. Do not exceed 155 characters.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3", "#Hashtag4", "#Hashtag5"],
  "localKeywords": ["Western North Carolina", "Asheville area", "WNC"],
  "geoTags": ["Asheville", "Buncombe County", "NC"],
  "entities": {
    "people": ["Names of people mentioned in article"],
    "organizations": ["Companies, agencies, schools mentioned"],
    "locations": ["Specific places, addresses, landmarks mentioned"],
    "topics": ["Main subject topics covered"]
  },
  "imageAltText": "Descriptive alt text for the article's featured image (max 125 chars)",
  "schema": {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${title}",
    "description": "Same as metaDescription",
    "keywords": "keyword1, keyword2, keyword3",
    "articleSection": "${categoryName}",
    "author": {
      "@type": "Person",
      "name": "${author}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "WNC Times",
      "url": "https://wnctimes.com"
    },
    "datePublished": "${publishedAt}",
    "dateModified": "${publishedAt}"
  }
}

REQUIREMENTS:
- metaDescription: MUST be under 155 characters, compelling and click-worthy
- keywords: 5-8 SEO focus keywords relevant to the article content
- hashtags: 5-8 social media hashtags with # prefix
- localKeywords: Geographic terms specific to Western North Carolina region
- geoTags: Specific cities, counties, or regions mentioned or relevant
- entities: Extract ONLY names/places actually mentioned in the article (empty arrays if none)
- imageAltText: Describe what the image likely shows based on article context (max 125 chars)
- schema: Valid NewsArticle schema.org JSON-LD

Return ONLY the JSON object, no explanation or markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`[SEO API] Gemini error: ${response.statusText}`);
      return getDefaultMetadata(title, categoryName, author, publishedAt);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!responseText) {
      console.error('[SEO API] Empty response from Gemini');
      return getDefaultMetadata(title, categoryName, author, publishedAt);
    }

    // Parse JSON response (handle markdown code blocks)
    let jsonText = responseText;
    if (jsonText.includes('```')) {
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      } else {
        jsonText = jsonText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
      }
    }

    if (!jsonText.startsWith('{')) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }

    console.log('[SEO API] Parsing JSON response, length:', jsonText.length);
    const parsed = JSON.parse(jsonText);
    console.log('[SEO API] Successfully parsed SEO metadata');

    return {
      metaDescription: (parsed.metaDescription || '').substring(0, 155),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.slice(0, 8).map((h: string) => h.startsWith('#') ? h : `#${h}`)
        : [],
      localKeywords: Array.isArray(parsed.localKeywords) ? parsed.localKeywords : ['Western North Carolina'],
      geoTags: Array.isArray(parsed.geoTags) ? parsed.geoTags : [],
      entities: {
        people: Array.isArray(parsed.entities?.people) ? parsed.entities.people : [],
        organizations: Array.isArray(parsed.entities?.organizations) ? parsed.entities.organizations : [],
        locations: Array.isArray(parsed.entities?.locations) ? parsed.entities.locations : [],
        topics: Array.isArray(parsed.entities?.topics) ? parsed.entities.topics : [],
      },
      imageAltText: (parsed.imageAltText || '').substring(0, 125),
      schema: typeof parsed.schema === 'object' ? JSON.stringify(parsed.schema) : '',
    };
  } catch (error) {
    console.error('[SEO API] Error generating metadata:', error);
    return getDefaultMetadata(title, categoryName, author, publishedAt);
  }
}

/**
 * Returns default metadata when generation fails
 */
function getDefaultMetadata(
  title: string,
  category: string,
  authorName: string,
  publishedAt: string
): GeneratedMetadata {
  const metaDescription = `${title} - Read the latest ${category} news from Western North Carolina on WNC Times.`.substring(0, 155);

  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  const keywords = [...new Set([category.toLowerCase(), ...titleWords])].slice(0, 8);
  const hashtags = keywords.slice(0, 5).map(t => `#${t.replace(/\s+/g, '')}`);

  return {
    metaDescription,
    keywords,
    hashtags: hashtags.length > 0 ? hashtags : [`#${category.replace(/\s+/g, '')}`, '#WNCNews', '#LocalNews'],
    localKeywords: ['Western North Carolina', 'WNC', 'Asheville area'],
    geoTags: ['Western North Carolina'],
    entities: {
      people: [],
      organizations: [],
      locations: [],
      topics: [category],
    },
    imageAltText: `${category} news from Western North Carolina`,
    schema: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: title,
      description: metaDescription,
      articleSection: category,
      author: { '@type': 'Person', name: authorName },
      publisher: { '@type': 'Organization', name: 'WNC Times', url: 'https://wnctimes.com' },
      datePublished: publishedAt,
      dateModified: publishedAt,
    }),
  };
}

function buildMetadataPrompt(
  title: string,
  content: string,
  category: string | undefined,
  generateTypes: string[]
): string {
  const truncatedContent = content.length > 2000
    ? content.substring(0, 2000) + '...'
    : content;

  let prompt = `You are an SEO and social media expert. Analyze the following news article and generate the requested metadata.

ARTICLE TITLE: ${title}
${category ? `CATEGORY: ${category}` : ''}

ARTICLE CONTENT:
${truncatedContent}

Generate the following metadata in the exact format specified:

`;

  if (generateTypes.includes('metaDescription')) {
    prompt += `META_DESCRIPTION: Write a compelling SEO meta description (maximum 155 characters) that summarizes the article and encourages clicks. Do not use quotes.

`;
  }

  if (generateTypes.includes('imageAltText')) {
    prompt += `IMAGE_ALT_TEXT: Write descriptive alt text for the featured image (maximum 125 characters) that describes what the image likely shows based on the article context. Be specific and descriptive for accessibility. Do not use quotes.

`;
  }

  if (generateTypes.includes('hashtags')) {
    prompt += `HASHTAGS: Generate 5-8 relevant hashtags for social media (include the # symbol). Focus on the main topics, location if relevant, and trending terms. Separate with commas.

`;
  }

  prompt += `
IMPORTANT:
- Use EXACTLY the labels shown above (META_DESCRIPTION:, IMAGE_ALT_TEXT:, HASHTAGS:)
- Each response should be on its own line after the label
- Do not include quotes around the text
- Be concise and impactful`;

  return prompt;
}

function parseMetadataResponse(
  responseText: string,
  generateTypes: string[]
): GeneratedMetadata {
  const metadata: GeneratedMetadata = {};

  if (generateTypes.includes('metaDescription')) {
    const metaMatch = responseText.match(/META_DESCRIPTION:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
    if (metaMatch) {
      let description = metaMatch[1].trim();
      description = description.replace(/^["']|["']$/g, '');
      metadata.metaDescription = description.substring(0, 155);
    }
  }

  if (generateTypes.includes('imageAltText')) {
    const altMatch = responseText.match(/IMAGE_ALT_TEXT:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
    if (altMatch) {
      let altText = altMatch[1].trim();
      altText = altText.replace(/^["']|["']$/g, '');
      metadata.imageAltText = altText.substring(0, 125);
    }
  }

  if (generateTypes.includes('hashtags')) {
    const hashtagMatch = responseText.match(/HASHTAGS:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/);
    if (hashtagMatch) {
      const hashtagText = hashtagMatch[1].trim();
      const hashtags = hashtagText.match(/#\w+/g) || [];
      const additionalTags = hashtagText
        .split(/[,\s]+/)
        .filter(tag => tag && !tag.startsWith('#'))
        .map(tag => `#${tag.replace(/^#/, '')}`);

      const allHashtags = [...new Set([...hashtags, ...additionalTags])]
        .filter(tag => tag.length > 1)
        .slice(0, 8);

      if (allHashtags.length > 0) {
        metadata.hashtags = allHashtags;
      }
    }
  }

  return metadata;
}
