import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/types/siteConfig';

export const dynamic = 'force-dynamic';

const SITE_CONFIG_DOC = 'site-config';
const CONFIG_COLLECTION = 'settings';

/**
 * GET - Fetch site configuration
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const configRef = db.collection(CONFIG_COLLECTION).doc(SITE_CONFIG_DOC);
    const doc = await configRef.get();

    if (!doc.exists) {
      // Initialize with defaults if not exists
      const defaultConfig = {
        ...DEFAULT_SITE_CONFIG,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await configRef.set(defaultConfig);
      return NextResponse.json({
        success: true,
        config: defaultConfig,
        initialized: true,
      });
    }

    return NextResponse.json({
      success: true,
      config: doc.data() as SiteConfig,
    });
  } catch (error) {
    console.error('Error fetching site config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update site configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'updates object is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const configRef = db.collection(CONFIG_COLLECTION).doc(SITE_CONFIG_DOC);

    // Get current config
    const doc = await configRef.get();
    const currentConfig = doc.exists ? doc.data() as SiteConfig : DEFAULT_SITE_CONFIG;

    // Deep merge updates with current config
    const updatedConfig: SiteConfig = deepMerge(currentConfig, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // Update legal.lastUpdated if legal content changed
    if (updates.legal) {
      updatedConfig.legal.lastUpdated = new Date().toISOString();
    }

    await configRef.set(updatedConfig, { merge: true });

    return NextResponse.json({
      success: true,
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating site config:', error);
    return NextResponse.json(
      { error: 'Failed to update site configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Reset site configuration to defaults
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'reset') {
      return NextResponse.json(
        { error: 'Invalid action. Use "reset" to reset configuration.' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const configRef = db.collection(CONFIG_COLLECTION).doc(SITE_CONFIG_DOC);

    const defaultConfig = {
      ...DEFAULT_SITE_CONFIG,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await configRef.set(defaultConfig);

    return NextResponse.json({
      success: true,
      config: defaultConfig,
      message: 'Configuration reset to defaults',
    });
  } catch (error) {
    console.error('Error resetting site config:', error);
    return NextResponse.json(
      { error: 'Failed to reset site configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Deep merge helper function for SiteConfig
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}
