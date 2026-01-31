import { NextResponse } from 'next/server';
import { getCollectionDocs, batchSetDocuments } from '@/lib/firestoreServer';
import { SiteMenu, DEFAULT_MENUS } from '@/types/menu';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

/**
 * GET - Public endpoint to fetch enabled menus for the frontend
 */
export async function GET() {
  try {
    const snapshot = await getCollectionDocs('menus');

    // If no menus exist, return defaults
    if (snapshot.empty) {
      // Initialize defaults in Firestore
      await batchSetDocuments(
        'menus',
        DEFAULT_MENUS.map(menu => ({ id: menu.id, data: menu }))
      );

      return NextResponse.json({
        success: true,
        menus: DEFAULT_MENUS,
      });
    }

    const menus: SiteMenu[] = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as SiteMenu))
      .filter(menu => menu.enabled) // Only return enabled menus
      .map(menu => ({
        ...menu,
        // Only include enabled items, sorted by order
        items: menu.items
          .filter(item => item.enabled)
          .sort((a, b) => a.order - b.order),
      }));

    return NextResponse.json({
      success: true,
      menus,
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    // Return defaults on error so the site doesn't break
    return NextResponse.json({
      success: true,
      menus: DEFAULT_MENUS,
      fallback: true,
    });
  }
}
