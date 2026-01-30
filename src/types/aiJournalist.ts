/**
 * Schedule configuration for AI agent autopilot
 */
export interface AgentSchedule {
  isEnabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;              // "14:30" for daily/weekly (24h format)
  daysOfWeek?: number[];      // [0,1,2,3,4,5,6] where 0=Sunday
  dayOfMonth?: number;        // 1-28 for monthly
  timezone: string;           // "America/New_York"
}

/**
 * Task configuration for scheduled runs
 */
export interface AgentTaskConfig {
  autoPublish: boolean;       // Auto-publish or save as draft
  maxArticlesPerRun: number;  // Limit per scheduled run
  sourcePreferences?: string[];// RSS feeds, topics, etc.
  categoryId?: string;        // Specific category to write for
  isFeatured?: boolean;       // Automatically mark articles as featured
  isBreakingNews?: boolean;   // Automatically mark articles as breaking news
  autopilotMode?: boolean;    // Enable "vacation mode" - auto-publish even with caution/review_recommended if confidence >= threshold
  autopilotConfidenceThreshold?: number; // Minimum fact-check confidence % for autopilot publishing (default: 70)
  forceAIGeneration?: boolean; // Skip stock photos, always use Gemini AI for images (~$0.05/image)
}

/**
 * Metrics tracking for AI agent performance
 */
export interface AgentMetrics {
  totalArticlesGenerated: number;
  totalPostsCreated: number;
  successfulRuns: number;
  failedRuns: number;
  averageGenerationTime: number; // in milliseconds
  lastSuccessfulRun?: string;    // ISO timestamp
}

/**
 * Role types for AI agents
 */
export type AgentRole = 'journalist' | 'social' | 'seo' | 'editor';

export interface AIJournalist {
  id: string;
  name: string;              // Display name, e.g., "Alex Chen"
  photoURL: string;          // Firebase Storage URL for avatar
  title: string;             // Job title, e.g., "Sports Reporter"
  beat: string;              // Category/beat they cover, e.g., "sports"
  bio?: string;              // Optional short biography
  isActive: boolean;         // Can be disabled without deleting
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
  createdBy: string;         // Admin UID who created this profile

  // Persona link (optional - for backwards compatibility)
  personaId?: string;        // References a document in the 'personas' collection

  // Scheduling fields
  agentRole: AgentRole;      // Type of agent
  schedule?: AgentSchedule;  // Autopilot schedule configuration
  taskConfig?: AgentTaskConfig; // Task settings for scheduled runs
  lastRunAt?: string;        // ISO timestamp of last scheduled run
  nextRunAt?: string;        // ISO timestamp of next scheduled run

  // Performance metrics
  metrics?: AgentMetrics;

  // A/B Testing Feature Flags (for article quality improvements)
  useWebSearch?: boolean;           // Enable Perplexity web search for current information (default: false)
  useFullArticleContent?: boolean;  // Fetch full article content from RSS URLs (default: true)
}

export type AIJournalistInput = Omit<AIJournalist, 'id' | 'createdAt' | 'updatedAt' | 'lastRunAt' | 'nextRunAt' | 'metrics'>;

export type AIJournalistUpdate = Partial<Omit<AIJournalist, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Common timezones for the US
 */
export const US_TIMEZONES = [
  { label: 'Eastern Time', value: 'America/New_York' },
  { label: 'Central Time', value: 'America/Chicago' },
  { label: 'Mountain Time', value: 'America/Denver' },
  { label: 'Pacific Time', value: 'America/Los_Angeles' },
  { label: 'Alaska Time', value: 'America/Anchorage' },
  { label: 'Hawaii Time', value: 'America/Honolulu' },
] as const;

/**
 * Days of the week for scheduling
 */
export const DAYS_OF_WEEK = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
] as const;

/**
 * Frequency options for scheduling
 */
export const SCHEDULE_FREQUENCIES = [
  { label: 'Hourly', value: 'hourly', description: 'Run every hour' },
  { label: 'Daily', value: 'daily', description: 'Run once per day at specified time' },
  { label: 'Weekly', value: 'weekly', description: 'Run on selected days each week' },
  { label: 'Monthly', value: 'monthly', description: 'Run once per month' },
] as const;
