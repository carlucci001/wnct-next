import 'server-only';
import { getAdminFirestore } from './firebase-admin';

const ITEMS_COLLECTION = 'contentItems';

/**
 * Mark a content item as processed (SERVER-ONLY version using Admin SDK)
 */
export async function markItemProcessed(itemId: string, articleId?: string): Promise<void> {
  try {
    await getAdminFirestore().collection(ITEMS_COLLECTION).doc(itemId).update({
      isProcessed: true,
      processedAt: new Date().toISOString(),
      articleId: articleId || null,
    });
  } catch (error) {
    console.error('Error marking item as processed:', error);
    throw error;
  }
}
