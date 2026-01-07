import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { SiteMenu, DEFAULT_MENUS } from '@/types/menu';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

/**
 * GET - Public endpoint to fetch enabled menus for the frontend
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const menusRef = db.collection('menus');
    const snapshot = await menusRef.get();

    // If no menus exist, return defaults
    if (snapshot.empty) {
      // Initialize defaults in Firestore
      const batch = db.batch();
      for (const menu of DEFAULT_MENUS) {
        batch.set(menusRef.doc(menu.id), menu);
      }
      await batch.commit();

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
