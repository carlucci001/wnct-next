import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

interface GenerateMetadataRequest {
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
  generateTypes: ('metaDescription' | 'imageAltText' | 'hashtags')[];
}

interface GeneratedMetadata {
  metaDescription?: string;
  imageAltText?: string;
  hashtags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateMetadataRequest = await request.json();
    const { title, content, category, imageUrl, generateTypes } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    if (!generateTypes || generateTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one generate type is required' },
        { status: 400 }
      );
    }

    // Get settings from Firestore
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();

    const apiKey = settings?.geminiApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please configure the Gemini API key in Admin settings.' },
        { status: 503 }
      );
    }

    const model = 'gemini-2.0-flash';

    // Build the prompt based on what needs to be generated
    const prompt = buildMetadataPrompt(title, content, category, imageUrl, generateTypes);

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
    console.error('Error generating metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildMetadataPrompt(
  title: string,
  content: string,
  category: string | undefined,
  imageUrl: string | undefined,
  generateTypes: string[]
): string {
  // Truncate content if too long
  const truncatedContent = content.length > 2000
    ? content.substring(0, 2000) + '...'
    : content;

  let prompt = `You are an SEO and social media expert. Analyze the following news article and generate the requested metadata.

ARTICLE TITLE: ${title}
${category ? `CATEGORY: ${category}` : ''}
${imageUrl ? `FEATURED IMAGE URL: ${imageUrl}` : ''}

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

  // Parse meta description
  if (generateTypes.includes('metaDescription')) {
    const metaMatch = responseText.match(/META_DESCRIPTION:\s*(.+?)(?=\n[A-Z_]+:|$)/s);
    if (metaMatch) {
      let description = metaMatch[1].trim();
      // Remove quotes if present
      description = description.replace(/^["']|["']$/g, '');
      // Limit to 155 characters
      metadata.metaDescription = description.substring(0, 155);
    }
  }

  // Parse image alt text
  if (generateTypes.includes('imageAltText')) {
    const altMatch = responseText.match(/IMAGE_ALT_TEXT:\s*(.+?)(?=\n[A-Z_]+:|$)/s);
    if (altMatch) {
      let altText = altMatch[1].trim();
      // Remove quotes if present
      altText = altText.replace(/^["']|["']$/g, '');
      // Limit to 125 characters
      metadata.imageAltText = altText.substring(0, 125);
    }
  }

  // Parse hashtags
  if (generateTypes.includes('hashtags')) {
    const hashtagMatch = responseText.match(/HASHTAGS:\s*(.+?)(?=\n[A-Z_]+:|$)/s);
    if (hashtagMatch) {
      const hashtagText = hashtagMatch[1].trim();
      // Extract hashtags (words starting with #)
      const hashtags = hashtagText.match(/#\w+/g) || [];
      // Also handle comma-separated without # and add them
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
