import 'server-only';
import { addDocument, updateDocument } from './firestoreServer';
import { getScheduledTask } from './scheduledTasks';
import type { ScheduledTaskInput, TaskStatus, TaskResult } from '@/types/scheduledTask';

const COLLECTION_NAME = 'scheduledTasks';

/**
 * Create a new scheduled task (SERVER-ONLY version)
 * Uses Admin SDK in production, Client SDK in development
 */
export async function createScheduledTask(data: ScheduledTaskInput): Promise<string> {
  try {
    const now = new Date().toISOString();
    const docId = await addDocument(COLLECTION_NAME, {
      ...data,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return docId;
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    throw error;
  }
}

/**
 * Update task status (SERVER-ONLY version)
 * Uses Admin SDK in production, Client SDK in development
 */
export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  result?: TaskResult
): Promise<void> {
  try {
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    if (status === 'running') {
      updateData.startedAt = now;
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = now;
    }

    if (result) {
      updateData.result = result;
    }

    await updateDocument(COLLECTION_NAME, id, updateData);
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}
