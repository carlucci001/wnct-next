/**
 * AI Configuration Types
 * Defines types for configuring AI models across platform features
 */

// AI Provider Types
export type AIProvider =
  | 'gemini'
  | 'claude'
  | 'openai'
  | 'perplexity'
  | 'elevenlabs'
  | 'google-tts'
  | 'dalle'
  | 'stock-photos';

// Model Types by Provider
export type GeminiModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-exp'
  | 'gemini-pro';

export type ClaudeModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240307';

export type OpenAIModel =
  | 'gpt-4-turbo-preview'
  | 'gpt-4'
  | 'gpt-3.5-turbo';

export type DALLEModel =
  | 'dall-e-3'
  | 'dall-e-2';

export type PerplexityModel =
  | 'sonar-pro'
  | 'sonar';

export type ElevenLabsModel =
  | 'eleven_turbo_v2'
  | 'eleven_multilingual_v2'
  | 'eleven_monolingual_v1';

export type GoogleTTSModel =
  | 'google-neural2-f'
  | 'google-neural2-c'
  | 'google-neural2-e'
  | 'google-neural2-a'
  | 'google-neural2-d';

export type StockPhotoProvider =
  | 'unsplash'
  | 'pexels';

// Feature Configuration
export interface AIFeatureConfig {
  enabled: boolean;
  primaryProvider: AIProvider;
  primaryModel: string;
  fallbackProvider?: AIProvider;
  fallbackModel?: string;
  temperature?: number; // 0-1
  maxTokens?: number;
  customParams?: Record<string, unknown>;
}

// Complete AI Configuration Settings
export interface AIConfigSettings {
  // Content Generation
  articleGeneration: AIFeatureConfig;
  metadataGeneration: AIFeatureConfig;

  // Quality Assurance
  factCheckQuick: AIFeatureConfig;
  factCheckDetailed: AIFeatureConfig;
  visualExtraction: AIFeatureConfig;

  // Media Generation
  imageGeneration: AIFeatureConfig;
  stockPhotoSearch: AIFeatureConfig;

  // Reader Engagement
  chatAssistant: AIFeatureConfig;
  textToSpeech: AIFeatureConfig;

  // Research & Data
  webSearch: AIFeatureConfig;

  // Cost Limits (optional)
  costLimit?: {
    daily?: number;
    monthly?: number;
    alertThreshold?: number; // 0-1, alert when reaching this % of limit
  };

  // Metadata
  lastUpdated: string;
  updatedBy: string;
}

// Feature Keys Type
export type AIFeatureKey = keyof Omit<AIConfigSettings, 'costLimit' | 'lastUpdated' | 'updatedBy'>;

// Model Option for UI Display
export interface ModelOption {
  provider: AIProvider;
  model: string;
  displayName: string;
  description: string;
  costPerOperation: number;
  speedRating: 'fast' | 'medium' | 'slow';
  qualityRating: 'standard' | 'high' | 'premium';
  recommended: boolean;
  requiresApiKey: string; // e.g., 'geminiApiKey', 'claudeCodeApiKey'
  supportsStreaming?: boolean;
  deprecated?: boolean;
  deprecationDate?: string;
  replacementModel?: string;
}

// Model Configuration Result
export interface ModelConfig {
  provider: AIProvider;
  model: string;
  params: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: unknown;
  };
}

// Test Result
export interface TestResult {
  success: boolean;
  responseTime?: number;
  cost?: number;
  error?: string;
  details?: string;
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Cost Estimate
export interface CostEstimate {
  feature: string;
  operationsPerMonth: number;
  costPerOperation: number;
  totalCost: number;
}

// Feature Category for UI Organization
export type FeatureCategory =
  | 'content'
  | 'quality'
  | 'media'
  | 'engagement'
  | 'research';

export interface FeatureMetadata {
  key: AIFeatureKey;
  category: FeatureCategory;
  displayName: string;
  description: string;
  icon: string; // lucide-react icon name
}
