import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * GET /api/admin/check-settings
 * Diagnostic endpoint to check what's actually in Firestore settings
 */
export async function GET() {
  try {
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();

    return NextResponse.json({
      success: true,
      settings: {
        hasOpenaiKey: !!settings?.openaiApiKey,
        openaiKeyLength: settings?.openaiApiKey?.length || 0,
        openaiKeyPreview: settings?.openaiApiKey ?
          `${settings.openaiApiKey.substring(0, 7)}...${settings.openaiApiKey.substring(settings.openaiApiKey.length - 4)}` :
          'NOT FOUND',
        hasGeminiKey: !!settings?.geminiApiKey,
        hasPexelsKey: !!settings?.pexelsApiKey,
        pexelsKeyPreview: settings?.pexelsApiKey ?
          `${settings.pexelsApiKey.substring(0, 7)}...${settings.pexelsApiKey.substring(settings.pexelsApiKey.length - 4)}` :
          'NOT FOUND',
        allSettingsKeys: Object.keys(settings || {})
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
