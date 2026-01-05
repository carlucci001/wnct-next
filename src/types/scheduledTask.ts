/**
 * Scheduled Task type definitions
 * Tasks are created when agents run on schedule
 */

export type TaskType = 'generate-article' | 'social-post' | 'seo-audit' | 'content-review';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Result of a scheduled task execution
 */
export interface TaskResult {
  articleId?: string;      // ID of generated article
  postId?: string;         // ID of generated social post
  error?: string;          // Error message if failed
  generationTime?: number; // Time taken in milliseconds
  tokensUsed?: number;     // AI tokens consumed
}

/**
 * A scheduled task record
 */
export interface ScheduledTask {
  id: string;
  agentId: string;              // Reference to AIJournalist
  agentName: string;            // Denormalized for display
  taskType: TaskType;
  status: TaskStatus;
  scheduledFor: string;         // ISO timestamp when task was scheduled
  startedAt?: string;           // ISO timestamp when task started
  completedAt?: string;         // ISO timestamp when task completed
  result?: TaskResult;
  retryCount: number;           // Number of retry attempts
  maxRetries: number;           // Maximum retry attempts allowed
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new scheduled task
 */
export type ScheduledTaskInput = Omit<ScheduledTask, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>;

/**
 * Task log entry for tracking task history
 */
export interface TaskLogEntry {
  timestamp: string;
  status: TaskStatus;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Summary stats for the task dashboard
 */
export interface TaskStats {
  pendingCount: number;
  runningCount: number;
  completedToday: number;
  failedToday: number;
  totalArticlesGenerated: number;
  averageGenerationTime: number;
}
