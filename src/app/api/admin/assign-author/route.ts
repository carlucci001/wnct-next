import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * GET - List all users and show current author distribution
 */
export async function GET() {
  try {
    const db = getAdminFirestore();

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      displayName: doc.data().displayName || doc.data().email || 'Unknown',
      email: doc.data().email,
      photoURL: doc.data().photoURL,
      role: doc.data().role,
    }));

    // Get article author distribution
    const articlesSnapshot = await db.collection('articles').get();
    const authorCounts: Record<string, number> = {};
    let importedAuthorCount = 0;

    articlesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const author = data.author || 'Unknown';
      authorCounts[author] = (authorCounts[author] || 0) + 1;

      // Count articles with "Imported Author" or similar
      if (author.toLowerCase().includes('import') ||
          author.toLowerCase().includes('staff') ||
          author === 'Unknown' ||
          !data.authorId) {
        importedAuthorCount++;
      }
    });

    return NextResponse.json({
      success: true,
      users,
      totalArticles: articlesSnapshot.docs.length,
      authorDistribution: authorCounts,
      importedAuthorCount,
    });
  } catch (error) {
    console.error('Error fetching users/authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Bulk assign articles to a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, assignAll, onlyImported } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Get the target user
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const authorName = userData.displayName || userData.email || 'Unknown';
    const authorPhotoURL = userData.photoURL || null;

    // Get articles to update
    const articlesSnapshot = await db.collection('articles').get();

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const doc of articlesSnapshot.docs) {
      const data = doc.data();

      // Determine if we should update this article
      let shouldUpdate = false;

      if (assignAll) {
        // Update all articles
        shouldUpdate = true;
      } else if (onlyImported) {
        // Only update articles with "Imported Author" or no authorId
        const author = data.author || '';
        shouldUpdate = author.toLowerCase().includes('import') ||
                       author.toLowerCase().includes('staff') ||
                       author === 'Unknown' ||
                       !data.authorId;
      }

      if (shouldUpdate) {
        try {
          await db.collection('articles').doc(doc.id).update({
            author: authorName,
            authorId: userId,
            authorPhotoURL: authorPhotoURL,
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
      message: `Assigned ${updated} articles to ${authorName}`,
      updated,
      skipped,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      assignedTo: {
        id: userId,
        name: authorName,
        photoURL: authorPhotoURL,
      }
    });
  } catch (error) {
    console.error('Error assigning author:', error);
    return NextResponse.json(
      { error: 'Failed to assign author', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
