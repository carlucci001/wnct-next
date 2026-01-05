import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import {
  ScheduledTask,
  ScheduledTaskInput,
  TaskStatus,
  TaskResult,
  TaskStats,
} from '@/types/scheduledTask';

const COLLECTION_NAME = 'scheduledTasks';

/**
 * Create a new scheduled task
 */
export async function createScheduledTask(data: ScheduledTaskInput): Promise<string> {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    throw error;
  }
}

/**
 * Get a scheduled task by ID
 */
export async function getScheduledTask(id: string): Promise<ScheduledTask | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      agentId: data.agentId || '',
      agentName: data.agentName || '',
      taskType: data.taskType || 'generate-article',
      status: data.status || 'pending',
      scheduledFor: data.scheduledFor || '',
      startedAt: data.startedAt || undefined,
      completedAt: data.completedAt || undefined,
      result: data.result || undefined,
      retryCount: data.retryCount || 0,
      maxRetries: data.maxRetries || 3,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    } as ScheduledTask;
  } catch (error) {
    console.error('Error fetching scheduled task:', error);
    return null;
  }
}

/**
 * Get all scheduled tasks with optional filtering
 */
export async function getScheduledTasks(options?: {
  status?: TaskStatus;
  agentId?: string;
  limitCount?: number;
}): Promise<ScheduledTask[]> {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('scheduledFor', 'desc'));

    // Note: Firestore doesn't support multiple inequality filters,
    // so we filter in memory for complex queries
    const querySnapshot = await getDocs(q);

    let tasks = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        agentId: data.agentId || '',
        agentName: data.agentName || '',
        taskType: data.taskType || 'generate-article',
        status: data.status || 'pending',
        scheduledFor: data.scheduledFor || '',
        startedAt: data.startedAt || undefined,
        completedAt: data.completedAt || undefined,
        result: data.result || undefined,
        retryCount: data.retryCount || 0,
        maxRetries: data.maxRetries || 3,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      } as ScheduledTask;
    });

    // Apply filters
    if (options?.status) {
      tasks = tasks.filter((t) => t.status === options.status);
    }
    if (options?.agentId) {
      tasks = tasks.filter((t) => t.agentId === options.agentId);
    }
    if (options?.limitCount) {
      tasks = tasks.slice(0, options.limitCount);
    }

    return tasks;
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    return [];
  }
}

/**
 * Get pending tasks that are ready to run
 */
export async function getPendingTasks(): Promise<ScheduledTask[]> {
  try {
    const now = new Date().toISOString();
    const tasks = await getScheduledTasks({ status: 'pending' });

    // Filter tasks where scheduledFor is in the past
    return tasks.filter((t) => t.scheduledFor <= now);
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return [];
  }
}

/**
 * Get recent tasks for an agent
 */
export async function getAgentTaskHistory(
  agentId: string,
  limitCount: number = 10
): Promise<ScheduledTask[]> {
  try {
    return await getScheduledTasks({ agentId, limitCount });
  } catch (error) {
    console.error('Error fetching agent task history:', error);
    return [];
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  result?: TaskResult
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
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

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

/**
 * Increment retry count and optionally update status
 */
export async function incrementRetryCount(id: string): Promise<boolean> {
  try {
    const task = await getScheduledTask(id);
    if (!task) throw new Error('Task not found');

    const newRetryCount = task.retryCount + 1;
    const shouldFail = newRetryCount >= task.maxRetries;

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      retryCount: newRetryCount,
      status: shouldFail ? 'failed' : 'pending',
      updatedAt: new Date().toISOString(),
      ...(shouldFail && {
        completedAt: new Date().toISOString(),
        result: { error: `Max retries (${task.maxRetries}) exceeded` },
      }),
    });

    return !shouldFail; // Returns true if can retry
  } catch (error) {
    console.error('Error incrementing retry count:', error);
    throw error;
  }
}

/**
 * Cancel a pending task
 */
export async function cancelTask(id: string): Promise<void> {
  try {
    const task = await getScheduledTask(id);
    if (!task) throw new Error('Task not found');

    if (task.status !== 'pending') {
      throw new Error('Can only cancel pending tasks');
    }

    await updateTaskStatus(id, 'cancelled');
  } catch (error) {
    console.error('Error cancelling task:', error);
    throw error;
  }
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Clean up old completed tasks (older than specified days)
 */
export async function cleanupOldTasks(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoff = cutoffDate.toISOString();

    const tasks = await getScheduledTasks();
    const tasksToDelete = tasks.filter(
      (t) =>
        (t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled') &&
        t.completedAt &&
        t.completedAt < cutoff
    );

    if (tasksToDelete.length === 0) return 0;

    const batch = writeBatch(db);
    tasksToDelete.forEach((task) => {
      const docRef = doc(db, COLLECTION_NAME, task.id);
      batch.delete(docRef);
    });

    await batch.commit();
    return tasksToDelete.length;
  } catch (error) {
    console.error('Error cleaning up old tasks:', error);
    throw error;
  }
}

/**
 * Get task statistics
 */
export async function getTaskStats(): Promise<TaskStats> {
  try {
    const tasks = await getScheduledTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const pendingCount = tasks.filter((t) => t.status === 'pending').length;
    const runningCount = tasks.filter((t) => t.status === 'running').length;

    const completedToday = tasks.filter(
      (t) => t.status === 'completed' && t.completedAt && t.completedAt >= todayStr
    ).length;

    const failedToday = tasks.filter(
      (t) => t.status === 'failed' && t.completedAt && t.completedAt >= todayStr
    ).length;

    const completedTasks = tasks.filter(
      (t) => t.status === 'completed' && t.result?.generationTime
    );

    const totalArticlesGenerated = tasks.filter(
      (t) => t.status === 'completed' && t.taskType === 'generate-article'
    ).length;

    const averageGenerationTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.result?.generationTime || 0), 0) /
          completedTasks.length
        : 0;

    return {
      pendingCount,
      runningCount,
      completedToday,
      failedToday,
      totalArticlesGenerated,
      averageGenerationTime,
    };
  } catch (error) {
    console.error('Error getting task stats:', error);
    return {
      pendingCount: 0,
      runningCount: 0,
      completedToday: 0,
      failedToday: 0,
      totalArticlesGenerated: 0,
      averageGenerationTime: 0,
    };
  }
}

/**
 * Create a task for an agent based on its schedule
 */
export async function createTaskForAgent(
  agentId: string,
  agentName: string,
  taskType: ScheduledTask['taskType'] = 'generate-article'
): Promise<string> {
  const now = new Date().toISOString();

  return await createScheduledTask({
    agentId,
    agentName,
    taskType,
    status: 'pending',
    scheduledFor: now,
    maxRetries: 3,
  });
}
