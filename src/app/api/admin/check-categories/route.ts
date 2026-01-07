import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET - Check category distribution of articles
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();

    const categoryCounts: Record<string, number> = {};
    let noCategory = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const category = data.category || '';

      if (!category) {
        noCategory++;
      } else {
        const categoryLower = category.toLowerCase();
        categoryCounts[categoryLower] = (categoryCounts[categoryLower] || 0) + 1;
      }
    });

    // Check which categories match the homepage display order
    const homepageCategories = ['news', 'sports', 'business', 'entertainment', 'lifestyle', 'outdoors'];
    const matchingCategories: Record<string, number> = {};
    const nonMatchingCategories: Record<string, number> = {};

    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (homepageCategories.includes(cat)) {
        matchingCategories[cat] = count;
      } else {
        nonMatchingCategories[cat] = count;
      }
    });

    const matchingCount = Object.values(matchingCategories).reduce((a, b) => a + b, 0);
    const nonMatchingCount = Object.values(nonMatchingCategories).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      total: snapshot.docs.length,
      noCategory,
      categoryCounts,
      homepageCategories,
      matchingCategories,
      nonMatchingCategories,
      summary: {
        visibleOnHomepage: matchingCount,
        notVisibleOnHomepage: nonMatchingCount + noCategory,
      }
    });
  } catch (error) {
    console.error('Error checking categories:', error);
    return NextResponse.json(
      { error: 'Failed to check categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
