import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firestoreServer';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/types/siteConfig';

export const dynamic = 'force-dynamic';

const SITE_CONFIG_DOC = 'site-config';
const CONFIG_COLLECTION = 'settings';

/**
 * GET - Public endpoint to fetch site configuration
 * Returns sanitized config without sensitive data
 */
export async function GET() {
  try {
    const doc = await getDocument(CONFIG_COLLECTION, SITE_CONFIG_DOC);

    let config: SiteConfig;

    if (!doc.exists) {
      // Return defaults if not configured
      config = DEFAULT_SITE_CONFIG;
    } else {
      config = doc.data() as SiteConfig;
    }

    // Return public-safe config (exclude sensitive business info)
    const publicConfig = {
      siteName: config.siteName,
      siteTagline: config.siteTagline,
      siteDescription: config.siteDescription,
      logoUrl: config.logoUrl,
      faviconUrl: config.faviconUrl,
      contact: {
        email: config.contact.email,
        phone: config.contact.phone,
        address: config.contact.address,
      },
      social: config.social,
      branding: config.branding,
      hours: config.hours,
      newsletter: {
        enabled: config.newsletter.enabled,
      },
      legal: {
        lastUpdated: config.legal.lastUpdated,
      },
    };

    return NextResponse.json({
      success: true,
      config: publicConfig,
    });
  } catch (error) {
    console.error('Error fetching public site config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site configuration' },
      { status: 500 }
    );
  }
}
