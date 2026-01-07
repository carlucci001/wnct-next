import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { SiteMenu, MenuItem, DEFAULT_MENUS } from '@/types/menu';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch all menus
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const menusRef = db.collection('menus');
    const snapshot = await menusRef.orderBy('slug').get();

    // If no menus exist, initialize with defaults
    if (snapshot.empty) {
      const batch = db.batch();
      for (const menu of DEFAULT_MENUS) {
        batch.set(menusRef.doc(menu.id), menu);
      }
      await batch.commit();

      return NextResponse.json({
        success: true,
        menus: DEFAULT_MENUS,
        initialized: true,
      });
    }

    const menus: SiteMenu[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as SiteMenu));

    return NextResponse.json({
      success: true,
      menus,
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menus', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new menu
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const menusRef = db.collection('menus');

    // Check if slug already exists
    const existing = await menusRef.where('slug', '==', slug).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'A menu with this slug already exists' },
        { status: 409 }
      );
    }

    const newMenu: SiteMenu = {
      id: slug,
      name,
      slug,
      description: description || '',
      items: [],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await menusRef.doc(slug).set(newMenu);

    return NextResponse.json({
      success: true,
      menu: newMenu,
    });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { error: 'Failed to create menu', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a menu (items, enabled state, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { menuId, updates } = body;

    if (!menuId) {
      return NextResponse.json(
        { error: 'menuId is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const menuRef = db.collection('menus').doc(menuId);
    const menuDoc = await menuRef.get();

    if (!menuDoc.exists) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    // Apply updates
    const updateData: Partial<SiteMenu> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await menuRef.update(updateData);

    const updatedDoc = await menuRef.get();
    const updatedMenu = { id: updatedDoc.id, ...updatedDoc.data() } as SiteMenu;

    return NextResponse.json({
      success: true,
      menu: updatedMenu,
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { error: 'Failed to update menu', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a menu
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    if (!menuId) {
      return NextResponse.json(
        { error: 'menuId is required' },
        { status: 400 }
      );
    }

    // Prevent deletion of core menus
    const CORE_MENUS = ['top-nav', 'main-nav', 'footer-quick-links', 'footer-categories'];
    if (CORE_MENUS.includes(menuId)) {
      return NextResponse.json(
        { error: 'Cannot delete core system menus' },
        { status: 403 }
      );
    }

    const db = getAdminFirestore();
    await db.collection('menus').doc(menuId).delete();

    return NextResponse.json({
      success: true,
      deleted: menuId,
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
