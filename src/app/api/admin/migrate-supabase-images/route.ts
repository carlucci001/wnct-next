import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage, getAdminFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

/**
 * GET - Preview: Count articles with Supabase images
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();

    let supabaseImages = 0;
    let firebaseImages = 0;
    let noImage = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const imageUrl = data.featuredImage || data.imageUrl || '';

      if (!imageUrl) {
        noImage++;
      } else if (imageUrl.includes('supabase.co')) {
        supabaseImages++;
      } else if (imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('storage.googleapis.com')) {
        firebaseImages++;
      } else {
        // Other external URLs
        supabaseImages++; // Count as needing migration
      }
    });

    return NextResponse.json({
      success: true,
      preview: {
        totalArticles: snapshot.docs.length,
        supabaseImages,
        firebaseImages,
        noImage,
        needsMigration: supabaseImages,
      },
    });
  } catch (error) {
    console.error('Error previewing migration:', error);
    return NextResponse.json(
      { error: 'Failed to preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Execute: Migrate Supabase images to Firebase Storage
 */
export async function POST(request: NextRequest) {
  const results: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || 50; // Process in batches

    const db = getAdminFirestore();
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();

    // Filter articles that need migration
    const articlesToMigrate = snapshot.docs.filter((doc) => {
      const data = doc.data();
      const imageUrl = data.featuredImage || data.imageUrl || '';
      return imageUrl && imageUrl.includes('supabase.co');
    });

    results.total = articlesToMigrate.length;
    console.log(`Found ${results.total} articles with Supabase images to migrate`);

    // Process in batches
    for (let i = 0; i < articlesToMigrate.length && i < batchSize; i++) {
      const doc = articlesToMigrate[i];
      const data = doc.data();
      const imageUrl = data.featuredImage || data.imageUrl || '';

      try {
        console.log(`Migrating image ${i + 1}/${Math.min(articlesToMigrate.length, batchSize)}: ${imageUrl.substring(0, 60)}...`);

        // Download the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Extract filename from URL
        const urlParts = imageUrl.split('/');
        let filename = urlParts[urlParts.length - 1].split('?')[0];
        if (!filename || filename.length > 100) {
          filename = `migrated-${Date.now()}.jpg`;
        }

        // Upload to Firebase Storage
        const filePath = `articles/${Date.now()}-${filename}`;
        const file = bucket.file(filePath);

        await file.save(buffer, {
          metadata: {
            contentType: contentType,
          },
        });

        // Make publicly accessible
        await file.makePublic();

        // Get public URL
        const newImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        // Update the article
        await articlesRef.doc(doc.id).update({
          featuredImage: newImageUrl,
          imageUrl: newImageUrl,
          imageMigratedAt: new Date().toISOString(),
          originalImageUrl: imageUrl,
        });

        results.migrated++;
        console.log(`Migrated: ${doc.id}`);
      } catch (error) {
        results.errors++;
        const errorMsg = `Article ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errorDetails.push(errorMsg);
        console.error(`Error migrating ${doc.id}:`, error);
      }
    }

    results.skipped = results.total - results.migrated - results.errors;

    return NextResponse.json({
      success: true,
      message: `Migrated ${results.migrated} of ${results.total} images`,
      results,
      remaining: results.total - results.migrated - results.errors,
    });
  } catch (error) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    );
  }
}
