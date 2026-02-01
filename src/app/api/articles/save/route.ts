import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { markItemProcessed } from '@/lib/contentSources';
import { updateAgentAfterRun } from '@/lib/aiJournalists.server';
import { reportArticleGenerated } from '@/lib/platformCredits';

export const dynamic = 'force-dynamic';

/**
 * POST /api/articles/save
 * Saves an article that was generated in preview mode
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { article, sourceItemId, agentId, status = 'draft' } = body;

    if (!article || !article.title || !article.content) {
      return NextResponse.json(
        { error: 'Article data with title and content is required' },
        { status: 400 }
      );
    }

    // Prepare article data for saving
    const articleData = {
      ...article,
      status,
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save article to Firestore
    const articleRef = await addDoc(collection(getDb(), 'articles'), articleData);

    // Mark content item as processed (if provided)
    if (sourceItemId) {
      try {
        await markItemProcessed(sourceItemId, articleRef.id);
      } catch (error) {
        console.error('Failed to mark source item as processed:', error);
        // Continue - article was saved successfully
      }
    }

    // Update agent metrics (if provided)
    if (agentId) {
      try {
        await updateAgentAfterRun(agentId, true, 0);
      } catch (error) {
        console.error('Failed to update agent metrics:', error);
        // Continue - article was saved successfully
      }
    }

    // Report credit usage to platform (non-blocking)
    reportArticleGenerated(article.title, articleRef.id, {
      sourceType: sourceItemId ? 'content-source' : 'manual',
    });

    return NextResponse.json({
      success: true,
      articleId: articleRef.id,
      status,
    });

  } catch (error) {
    console.error('Save article error:', error);
    return NextResponse.json(
      { error: 'Failed to save article', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
