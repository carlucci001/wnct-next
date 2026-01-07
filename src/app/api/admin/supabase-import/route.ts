import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseClient,
  testSupabaseConnection,
  fetchSupabaseArticles,
  fetchSupabaseCategories,
  importArticlesToFirebase,
  importCategoriesToFirebase,
  previewImport,
  clearAllArticles,
  ImportStats,
} from '@/lib/supabaseImport';

// Force dynamic rendering - this route uses external APIs and cannot be prerendered
export const dynamic = 'force-dynamic';

interface ImportRequest {
  supabaseUrl: string;
  supabaseKey: string;
  dateFrom?: string;
  dateTo?: string;
  importArticles: boolean;
  importImages: boolean;
  importCategories: boolean;
  importAuthors: boolean;
  clearFirst: boolean; // Clear all existing articles before import
}

interface ImportResult {
  articles: ImportStats;
  images: ImportStats;
  categories: ImportStats;
  authors: ImportStats;
}

/**
 * GET /api/admin/supabase-import
 * Test connection and preview import counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabaseUrl = searchParams.get('supabaseUrl');
    const supabaseKey = searchParams.get('supabaseKey');
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase URL or API key' },
        { status: 400 }
      );
    }

    // Create client and test connection
    const client = createSupabaseClient(supabaseUrl, supabaseKey);
    const connectionTest = await testSupabaseConnection(client);

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          error: `Supabase connection failed: ${connectionTest.error}`,
          details: connectionTest.details
        },
        { status: 401 }
      );
    }

    // Get preview counts
    const preview = await previewImport(client, dateFrom, dateTo);

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'Connection successful. Preview counts ready.',
      preview: {
        articles: {
          found: preview.articles.found,
          wouldSkip: preview.articles.wouldSkip,
          wouldImport: preview.articles.found - preview.articles.wouldSkip,
        },
        categories: {
          found: preview.categories.found,
          wouldSkip: preview.categories.wouldSkip,
          wouldImport: preview.categories.found - preview.categories.wouldSkip,
        },
        authors: {
          found: preview.authors.found,
        },
      },
      dateRange: {
        from: dateFrom || 'Not specified',
        to: dateTo || 'Not specified',
      },
    });
  } catch (error) {
    console.error('Error previewing Supabase import:', error);
    return NextResponse.json(
      {
        error: 'Failed to preview import',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/supabase-import
 * Execute the import from Supabase to Firebase
 */
export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json();
    const {
      supabaseUrl,
      supabaseKey,
      dateFrom,
      dateTo,
      importArticles,
      importImages,
      importCategories,
      clearFirst,
    } = body;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase URL or API key' },
        { status: 400 }
      );
    }

    // Create client and test connection
    const client = createSupabaseClient(supabaseUrl, supabaseKey);
    const connectionTest = await testSupabaseConnection(client);

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          error: `Supabase connection failed: ${connectionTest.error}`,
          details: connectionTest.details
        },
        { status: 401 }
      );
    }

    // Initialize results
    const results: ImportResult & { cleared?: { deleted: number; errors: number } } = {
      articles: { found: 0, imported: 0, skipped: 0, errors: 0 },
      images: { found: 0, imported: 0, skipped: 0, errors: 0 },
      categories: { found: 0, imported: 0, skipped: 0, errors: 0 },
      authors: { found: 0, imported: 0, skipped: 0, errors: 0 },
    };

    // Clear all existing articles first if requested
    if (clearFirst) {
      console.log('Clearing all existing articles before import...');
      results.cleared = await clearAllArticles();
      console.log(`Cleared ${results.cleared.deleted} articles`);
    }

    // Import categories first (so articles can reference them)
    if (importCategories) {
      const categories = await fetchSupabaseCategories(client);
      results.categories = await importCategoriesToFirebase(categories);
    }

    // Import articles (with optional image migration)
    if (importArticles) {
      const articles = await fetchSupabaseArticles(client, dateFrom, dateTo);
      results.articles = await importArticlesToFirebase(articles, importImages);

      // Track image stats separately
      if (importImages) {
        // Count articles that had images to migrate
        const articlesWithImages = articles.filter(
          a => a.featured_image || a.image_url
        ).length;
        results.images = {
          found: articlesWithImages,
          imported: results.articles.imported, // Images migrated with articles
          skipped: 0,
          errors: 0,
        };
      }
    }

    // Note: Authors are currently handled inline during article import
    // Future enhancement: create separate author profiles

    return NextResponse.json({
      success: true,
      message: `Import complete. Imported ${results.articles.imported} articles, ${results.categories.imported} categories.`,
      results,
      dateRange: {
        from: dateFrom || 'Not specified',
        to: dateTo || 'Not specified',
      },
    });
  } catch (error) {
    console.error('Error running Supabase import:', error);
    return NextResponse.json(
      {
        error: 'Failed to run import',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
