import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET - Debug article data structure
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.limit(10).get();

    const articles = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title?.substring(0, 50),
        status: data.status,
        category: data.category,
        hasPublishedAt: !!data.publishedAt,
        hasCreatedAt: !!data.createdAt,
        hasDate: !!data.date,
        hasFeaturedImage: !!data.featuredImage,
        hasImageUrl: !!data.imageUrl,
        publishedAt: data.publishedAt,
        createdAt: data.createdAt,
      };
    });

    // Count issues
    const allDocs = await articlesRef.get();
    let missingDates = 0;
    let missingImages = 0;
    let wrongStatus = 0;

    allDocs.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.publishedAt && !data.createdAt && !data.date) {
        missingDates++;
      }
      if (!data.featuredImage && !data.imageUrl) {
        missingImages++;
      }
      if (data.status?.toLowerCase() !== 'published') {
        wrongStatus++;
      }
    });

    return NextResponse.json({
      success: true,
      total: allDocs.docs.length,
      sample: articles,
      issues: {
        missingDates,
        missingImages,
        wrongStatus,
      }
    });
  } catch (error) {
    console.error('Error debugging articles:', error);
    return NextResponse.json(
      { error: 'Failed to debug', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
