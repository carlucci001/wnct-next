import { getDb } from './firebase';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { AIJournalist, AIJournalistInput, AIJournalistUpdate, AgentSchedule, AgentRole } from '@/types/aiJournalist';

const COLLECTION_NAME = 'aiJournalists';

/**
 * Fetch all AI journalists
 * @param activeOnly - If true, only return active journalists (default: false)
 */
export async function getAllAIJournalists(activeOnly: boolean = false): Promise<AIJournalist[]> {
  try {
    const querySnapshot = await getDocs(collection(getDb(), COLLECTION_NAME));
    const journalists = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        photoURL: data.photoURL || '',
        title: data.title || '',
        beat: data.beat || '',
        bio: data.bio || '',
        isActive: data.isActive ?? true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        createdBy: data.createdBy || '',
        // Scheduling fields
        agentRole: data.agentRole || 'journalist',
        schedule: data.schedule || undefined,
        taskConfig: data.taskConfig || undefined,
        lastRunAt: data.lastRunAt || undefined,
        nextRunAt: data.nextRunAt || undefined,
        // Metrics
        metrics: data.metrics || undefined,
      } as AIJournalist;
    });

    // Sort by name
    journalists.sort((a, b) => a.name.localeCompare(b.name));

    if (activeOnly) {
      return journalists.filter(j => j.isActive);
    }
    return journalists;
  } catch (error) {
    console.error('Error fetching AI journalists:', error);
    return [];
  }
}

/**
 * Fetch a single AI journalist by ID
 */
export async function getAIJournalist(id: string): Promise<AIJournalist | null> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      photoURL: data.photoURL || '',
      title: data.title || '',
      beat: data.beat || '',
      bio: data.bio || '',
      isActive: data.isActive ?? true,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      createdBy: data.createdBy || '',
      // Scheduling fields
      agentRole: data.agentRole || 'journalist',
      schedule: data.schedule || undefined,
      taskConfig: data.taskConfig || undefined,
      lastRunAt: data.lastRunAt || undefined,
      nextRunAt: data.nextRunAt || undefined,
      // Metrics
      metrics: data.metrics || undefined,
    } as AIJournalist;
  } catch (error) {
    console.error('Error fetching AI journalist:', error);
    return null;
  }
}

/**
 * Create a new AI journalist
 */
export async function createAIJournalist(data: AIJournalistInput): Promise<string> {
  try {
    const now = new Date().toISOString();
    const cleanData = removeUndefined({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), cleanData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating AI journalist:', error);
    throw error;
  }
}

/**
 * Update an existing AI journalist
 */
export async function updateAIJournalist(id: string, data: Partial<AIJournalistInput>): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    const cleanData = removeUndefined({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error('Error updating AI journalist:', error);
    throw error;
  }
}

/**
 * Delete an AI journalist
 */
export async function deleteAIJournalist(id: string): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting AI journalist:', error);
    throw error;
  }
}

/**
 * Toggle active status of an AI journalist
 */
export async function toggleAIJournalistStatus(id: string, currentStatus: boolean): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isActive: !currentStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error toggling AI journalist status:', error);
    throw error;
  }
}

/**
 * Helper to remove undefined values from an object (Firestore doesn't accept undefined)
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Update an AI journalist's schedule
 */
export async function updateAIJournalistSchedule(
  id: string,
  schedule: AgentSchedule | null,
  taskConfig?: AIJournalist['taskConfig']
): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);

    // Verify document exists first
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`AI Journalist with id ${id} not found`);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (schedule === null) {
      // Disable scheduling
      updateData.schedule = null;
      updateData.nextRunAt = null;
    } else {
      // Remove any undefined values from schedule
      updateData.schedule = removeUndefined(schedule as unknown as Record<string, unknown>);
      if (schedule.isEnabled) {
        updateData.nextRunAt = calculateNextRunTime(schedule);
      } else {
        updateData.nextRunAt = null;
      }
    }

    if (taskConfig !== undefined) {
      // Remove any undefined values from taskConfig
      updateData.taskConfig = removeUndefined(taskConfig as unknown as Record<string, unknown>);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating AI journalist schedule:', error);
    throw error;
  }
}

/**
 * Toggle schedule enabled status
 */
export async function toggleScheduleStatus(id: string, currentlyEnabled: boolean): Promise<void> {
  try {
    const journalist = await getAIJournalist(id);
    if (!journalist?.schedule) {
      throw new Error('No schedule configured for this agent');
    }

    const updatedSchedule = {
      ...journalist.schedule,
      isEnabled: !currentlyEnabled,
    };

    await updateAIJournalistSchedule(id, updatedSchedule);
  } catch (error) {
    console.error('Error toggling schedule status:', error);
    throw error;
  }
}

/**
 * Get all agents with active schedules that are due to run
 */
export async function getDueScheduledAgents(): Promise<AIJournalist[]> {
  try {
    const now = new Date().toISOString();
    const allJournalists = await getAllAIJournalists(true); // Only active agents

    return allJournalists.filter((j) => {
      if (!j.schedule?.isEnabled || !j.nextRunAt) return false;
      return j.nextRunAt <= now;
    });
  } catch (error) {
    console.error('Error fetching due scheduled agents:', error);
    return [];
  }
}

/**
 * Get all agents with scheduling enabled
 */
export async function getScheduledAgents(): Promise<AIJournalist[]> {
  try {
    const allJournalists = await getAllAIJournalists();
    return allJournalists.filter((j) => j.schedule?.isEnabled);
  } catch (error) {
    console.error('Error fetching scheduled agents:', error);
    return [];
  }
}

/**
 * Calculate the next run time based on schedule configuration
 */
export function calculateNextRunTime(schedule: AgentSchedule): string {
  const now = new Date();
  let nextRun = new Date(now);

  // Use the schedule's timezone for calculations
  const timeZone = schedule.timezone || 'America/New_York';

  switch (schedule.frequency) {
    case 'hourly':
      nextRun.setHours(nextRun.getHours() + 1);
      nextRun.setMinutes(0, 0, 0);
      break;

    case 'daily':
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
        // If the time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else {
        // Default to 9 AM
        nextRun.setHours(9, 0, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;

    case 'weekly':
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
      } else {
        nextRun.setHours(9, 0, 0, 0);
      }

      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        const sortedDays = [...schedule.daysOfWeek].sort((a, b) => a - b);
        const currentDay = nextRun.getDay();

        // Find the next scheduled day
        let foundDay = false;
        for (const day of sortedDays) {
          if (day > currentDay || (day === currentDay && nextRun > now)) {
            const daysUntil = day - currentDay;
            nextRun.setDate(nextRun.getDate() + daysUntil);
            foundDay = true;
            break;
          }
        }

        // If no day found this week, use first day of next week
        if (!foundDay) {
          const firstDay = sortedDays[0];
          const daysUntil = 7 - currentDay + firstDay;
          nextRun.setDate(nextRun.getDate() + daysUntil);
        }
      } else {
        // Default to Monday
        const daysUntilMonday = (8 - nextRun.getDay()) % 7 || 7;
        nextRun.setDate(nextRun.getDate() + daysUntilMonday);
      }
      break;

    case 'monthly':
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
      } else {
        nextRun.setHours(9, 0, 0, 0);
      }

      const dayOfMonth = schedule.dayOfMonth || 1;
      nextRun.setDate(dayOfMonth);

      // If this month's date has passed, go to next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(dayOfMonth);
      }
      break;
  }

  return nextRun.toISOString();
}

/**
 * Format next run time for display
 */
export function formatNextRun(nextRunAt: string | undefined, timezone: string = 'America/New_York'): string {
  if (!nextRunAt) return 'Not scheduled';

  const nextRun = new Date(nextRunAt);
  const now = new Date();

  // Check if it's within the next 24 hours
  const diffMs = nextRun.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    return 'Overdue';
  } else if (diffHours < 1) {
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    const hours = Math.round(diffHours);
    return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return nextRun.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    });
  }
}
