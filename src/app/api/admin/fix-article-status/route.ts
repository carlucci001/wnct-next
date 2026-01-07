import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface StatusCounts {
  published: number;
  draft: number;
  review: number;
  archived: number;
  other: number;
  [key: string]: number;
}

/**
 * GET - Check article status distribution
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();

    const statusCounts: StatusCounts = {
      published: 0,
      draft: 0,
      review: 0,
      archived: 0,
      other: 0,
    };

    const otherStatuses: Record<string, number> = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const status = (data.status || 'unknown').toLowerCase();

      if (status === 'published') {
        statusCounts.published++;
      } else if (status === 'draft') {
        statusCounts.draft++;
      } else if (status === 'review') {
        statusCounts.review++;
      } else if (status === 'archived') {
        statusCounts.archived++;
      } else {
        statusCounts.other++;
        otherStatuses[status] = (otherStatuses[status] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      total: snapshot.docs.length,
      statusCounts,
      otherStatuses,
      visibleOnFrontend: statusCounts.published,
      hiddenFromFrontend: snapshot.docs.length - statusCounts.published,
    });
  } catch (error) {
    console.error('Error checking article statuses:', error);
    return NextResponse.json(
      { error: 'Failed to check statuses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Bulk update article statuses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromStatus, toStatus, updateAll } = body;

    if (!toStatus) {
      return NextResponse.json(
        { error: 'toStatus is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process articles
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const currentStatus = (data.status || '').toLowerCase();

      // Determine if we should update this article
      let shouldUpdate = false;

      if (updateAll) {
        // Update all non-published articles to the target status
        shouldUpdate = currentStatus !== toStatus.toLowerCase();
      } else if (fromStatus) {
        // Update articles matching the source status
        shouldUpdate = currentStatus === fromStatus.toLowerCase();
      } else {
        // Update all articles that are NOT already the target status
        shouldUpdate = currentStatus !== toStatus.toLowerCase();
      }

      if (shouldUpdate) {
        try {
          await articlesRef.doc(doc.id).update({
            status: toStatus,
            updatedAt: new Date().toISOString(),
          });
          updated++;
        } catch (error) {
          errors.push(`${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} articles to status "${toStatus}"`,
      updated,
      skipped,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Error updating article statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update statuses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
