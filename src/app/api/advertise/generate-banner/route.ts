// API endpoint to generate advertising banners using AI
// POST /api/advertise/generate-banner

import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeBusinessFromUrl,
  analyzeBusinessFromDirectory,
  generateBannerWithGemini,
  type BusinessAnalysis,
} from '@/lib/ai/bannerGeneration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateBannerRequest {
  businessSource: 'url' | 'directory';
  businessUrl?: string;
  businessId?: string;
  regenerate?: boolean;
}

interface GenerateBannerResponse {
  success: boolean;
  imageData?: string;
  prompt?: string;
  analysis?: BusinessAnalysis;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateBannerResponse>> {
  try {
    const body: GenerateBannerRequest = await request.json();
    const { businessSource, businessUrl, businessId, regenerate = false } = body;

    // Validate input
    if (businessSource === 'url' && !businessUrl) {
      return NextResponse.json(
        { success: false, error: 'businessUrl is required when businessSource is "url"' },
        { status: 400 }
      );
    }

    if (businessSource === 'directory' && !businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId is required when businessSource is "directory"' },
        { status: 400 }
      );
    }

    console.log('Generating banner:', { businessSource, businessUrl, businessId, regenerate });

    // Step 1: Analyze the business
    let analysis: BusinessAnalysis;

    if (businessSource === 'url' && businessUrl) {
      analysis = await analyzeBusinessFromUrl(businessUrl);
    } else if (businessSource === 'directory' && businessId) {
      analysis = await analyzeBusinessFromDirectory(businessId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid business source' },
        { status: 400 }
      );
    }

    console.log('Business analysis complete:', analysis);

    // Step 2: Generate banner with Gemini
    const result = await generateBannerWithGemini(analysis, regenerate);

    console.log('Banner generation complete');

    return NextResponse.json({
      success: true,
      imageData: result.imageData,
      prompt: result.prompt,
      analysis: result.analysis,
    });

  } catch (error) {
    console.error('Error generating banner:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate banner',
      },
      { status: 500 }
    );
  }
}
