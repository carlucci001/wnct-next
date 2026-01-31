import 'server-only';
import { updateDocument } from './firestoreServer';

const ITEMS_COLLECTION = 'contentItems';

/**
 * Mark a content item as processed (SERVER-ONLY version)
 * Uses Admin SDK in production, Client SDK in development
 */
export async function markItemProcessed(itemId: string, articleId?: string): Promise<void> {
  try {
    await updateDocument(ITEMS_COLLECTION, itemId, {
      isProcessed: true,
      processedAt: new Date().toISOString(),
      articleId: articleId || null,
    });
  } catch (error) {
    console.error('Error marking item as processed:', error);
    throw error;
  }
}
