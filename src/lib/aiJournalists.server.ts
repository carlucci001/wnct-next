import 'server-only';
import { getAdminFirestore } from './firebase-admin';
import { getAIJournalist } from './aiJournalists';
import { AgentSchedule, calculateNextRunTime } from './aiJournalists';

const COLLECTION_NAME = 'aiJournalists';

/**
 * Update agent's last run time and calculate next run (SERVER-ONLY version using Admin SDK)
 * This bypasses Firestore security rules for server-side cron jobs
 */
export async function updateAgentAfterRun(
  id: string,
  success: boolean,
  generationTime?: number
): Promise<void> {
  try {
    const journalist = await getAIJournalist(id);
    if (!journalist) throw new Error('Agent not found');

    const now = new Date().toISOString();

    const currentMetrics = journalist.metrics || {
      totalArticlesGenerated: 0,
      totalPostsCreated: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageGenerationTime: 0,
    };

    const newMetrics = {
      ...currentMetrics,
      successfulRuns: success ? currentMetrics.successfulRuns + 1 : currentMetrics.successfulRuns,
      failedRuns: success ? currentMetrics.failedRuns : currentMetrics.failedRuns + 1,
      totalArticlesGenerated: success
        ? currentMetrics.totalArticlesGenerated + 1
        : currentMetrics.totalArticlesGenerated,
      lastSuccessfulRun: success ? now : currentMetrics.lastSuccessfulRun,
    };

    // Update average generation time
    if (generationTime && success) {
      const totalRuns = newMetrics.successfulRuns;
      const oldAvg = currentMetrics.averageGenerationTime;
      newMetrics.averageGenerationTime = oldAvg + (generationTime - oldAvg) / totalRuns;
    }

    const updateData: Record<string, unknown> = {
      lastRunAt: now,
      metrics: newMetrics,
      updatedAt: now,
    };

    // Calculate next run if schedule is enabled
    if (journalist.schedule?.isEnabled) {
      updateData.nextRunAt = calculateNextRunTime(journalist.schedule);
    }

    // Use Admin SDK (bypasses auth requirements for server-side operations)
    await getAdminFirestore().collection(COLLECTION_NAME).doc(id).update(updateData);
  } catch (error) {
    console.error('Error updating agent after run:', error);
    throw error;
  }
}
