import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

/**
 * POST /api/admin/fix-featured
 * One-time cleanup: For each category, only the 3 most recent articles should be featured.
 * All others get unfeatured. Also clears breaking news from all except most recent.
 */
export async function POST() {
  try {
    // Fetch all articles
    const articlesSnapshot = await getDocs(collection(db, 'articles'));
    const articles = articlesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group articles by category
    const byCategory: Record<string, typeof articles> = {};

    articles.forEach(article => {
      const category = (article.category || 'uncategorized').toLowerCase();
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(article);
    });

    // For each category, sort by date and update featured status
    const batch = writeBatch(db);
    let featuredCount = 0;
    let unfeaturedCount = 0;
    let breakingClearedCount = 0;

    for (const [category, categoryArticles] of Object.entries(byCategory)) {
      // Sort by publishedAt or createdAt (newest first)
      categoryArticles.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Top 3 should be featured, rest should not
      categoryArticles.forEach((article, index) => {
        const shouldBeFeatured = index < 3;
        const currentlyFeatured = article.isFeatured === true;
        const isBreaking = article.isBreakingNews === true;

        // Only keep breaking news on the #1 article per category (optional - remove if you want no breaking)
        const shouldBeBreaking = index === 0 && isBreaking; // Keep breaking only on newest

        // Check if we need to update
        const needsUpdate =
          currentlyFeatured !== shouldBeFeatured ||
          (isBreaking && !shouldBeBreaking);

        if (needsUpdate) {
          const docRef = doc(db, 'articles', article.id);
          const updates: Record<string, unknown> = {
            isFeatured: shouldBeFeatured,
            updatedAt: new Date().toISOString(),
          };

          // Clear breaking news if not the top article
          if (isBreaking && !shouldBeBreaking) {
            updates.isBreakingNews = false;
            updates.breakingNewsTimestamp = null;
            breakingClearedCount++;
          }

          batch.update(docRef, updates);

          if (shouldBeFeatured && !currentlyFeatured) {
            featuredCount++;
          } else if (!shouldBeFeatured && currentlyFeatured) {
            unfeaturedCount++;
          }
        }
      });
    }

    // Commit all updates
    await batch.commit();

    const categories = Object.keys(byCategory);

    return NextResponse.json({
      success: true,
      message: `Fixed featured articles across ${categories.length} categories`,
      stats: {
        categoriesProcessed: categories.length,
        articlesNewlyFeatured: featuredCount,
        articlesUnfeatured: unfeaturedCount,
        breakingNewsCleared: breakingClearedCount,
        categories: categories.map(cat => ({
          name: cat,
          totalArticles: byCategory[cat].length,
          featuredCount: Math.min(3, byCategory[cat].length)
        }))
      }
    });
  } catch (error) {
    console.error('Error fixing featured articles:', error);
    return NextResponse.json(
      { error: 'Failed to fix featured articles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/fix-featured
 * Preview what changes would be made (dry run)
 */
export async function GET() {
  try {
    // Fetch all articles
    const articlesSnapshot = await getDocs(collection(db, 'articles'));
    const articles = articlesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group articles by category
    const byCategory: Record<string, typeof articles> = {};

    articles.forEach(article => {
      const category = (article.category || 'uncategorized').toLowerCase();
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(article);
    });

    // Preview changes
    const preview: Record<string, { willFeature: string[]; willUnfeature: string[]; willClearBreaking: string[] }> = {};

    for (const [category, categoryArticles] of Object.entries(byCategory)) {
      categoryArticles.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      preview[category] = {
        willFeature: [],
        willUnfeature: [],
        willClearBreaking: []
      };

      categoryArticles.forEach((article, index) => {
        const shouldBeFeatured = index < 3;
        const currentlyFeatured = article.isFeatured === true;
        const isBreaking = article.isBreakingNews === true;

        if (shouldBeFeatured && !currentlyFeatured) {
          preview[category].willFeature.push(article.title);
        } else if (!shouldBeFeatured && currentlyFeatured) {
          preview[category].willUnfeature.push(article.title);
        }

        if (isBreaking && index > 0) {
          preview[category].willClearBreaking.push(article.title);
        }
      });
    }

    // Count totals
    let totalToFeature = 0;
    let totalToUnfeature = 0;
    let totalBreakingToClear = 0;

    Object.values(preview).forEach(cat => {
      totalToFeature += cat.willFeature.length;
      totalToUnfeature += cat.willUnfeature.length;
      totalBreakingToClear += cat.willClearBreaking.length;
    });

    return NextResponse.json({
      success: true,
      message: 'Dry run preview - no changes made. POST to this endpoint to apply changes.',
      summary: {
        totalCategories: Object.keys(byCategory).length,
        totalArticles: articles.length,
        willFeature: totalToFeature,
        willUnfeature: totalToUnfeature,
        willClearBreaking: totalBreakingToClear
      },
      byCategory: preview
    });
  } catch (error) {
    console.error('Error previewing featured fix:', error);
    return NextResponse.json(
      { error: 'Failed to preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
