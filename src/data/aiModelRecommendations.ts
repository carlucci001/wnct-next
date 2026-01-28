/**
 * AI Model Recommendations
 * Defines available models for each feature with costs, ratings, and recommendations
 */

import { ModelOption, AIFeatureKey, FeatureMetadata } from '@/types/aiConfig';

/**
 * Complete matrix of available models per feature
 */
export const MODEL_RECOMMENDATIONS: Record<AIFeatureKey, ModelOption[]> = {
  articleGeneration: [
    {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      description: 'Best balance of speed, cost, and quality for article generation',
      costPerOperation: 0.002,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true,
      requiresApiKey: 'geminiApiKey',
      supportsStreaming: true,
    },
    {
      provider: 'claude',
      model: 'claude-3-5-sonnet-latest',
      displayName: 'Claude 3.5 Sonnet',
      description: 'Premium quality, more nuanced writing, higher cost',
      costPerOperation: 0.015,
      speedRating: 'medium',
      qualityRating: 'premium',
      recommended: false,
      requiresApiKey: 'claudeCodeApiKey',
    },
    {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      displayName: 'Gemini 2.0 Flash',
      description: 'DEPRECATED - Retiring March 2026. Use 2.5 Flash instead.',
      costPerOperation: 0.0015,
      speedRating: 'fast',
      qualityRating: 'standard',
      recommended: false,
      requiresApiKey: 'geminiApiKey',
      deprecated: true,
      deprecationDate: '2026-03-31',
      replacementModel: 'gemini-2.5-flash',
    },
    {
      provider: 'claude',
      model: 'claude-3-haiku-20240307',
      displayName: 'Claude 3 Haiku',
      description: 'Fast and affordable Claude option',
      costPerOperation: 0.003,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: false,
      requiresApiKey: 'claudeCodeApiKey',
    },
  ],

  metadataGeneration: [
    {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      description: 'Optimized for short-form content like descriptions and tags',
      costPerOperation: 0.0005,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true,
      requiresApiKey: 'geminiApiKey',
    },
    {
      provider: 'claude',
      model: 'claude-3-haiku-20240307',
      displayName: 'Claude 3 Haiku',
      description: 'Fast, concise metadata generation',
      costPerOperation: 0.0008,
      speedRating: 'fast',
      qualityRating: 'premium',
      recommended: false,
      requiresApiKey: 'claudeCodeApiKey',
    },
  ],

  factCheckQuick: [
    {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      description: 'Fast fact-checking for quick reviews',
      costPerOperation: 0.0005,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true,
      requiresApiKey: 'geminiApiKey',
    },
    {
      provider: 'claude',
      model: 'claude-3-haiku-20240307',
      displayName: 'Claude 3 Haiku',
      description: 'Better reasoning for fact-checking',
      costPerOperation: 0.001,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: false,
      requiresApiKey: 'claudeCodeApiKey',
    },
  ],

  factCheckDetailed: [
    {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      description: 'Thorough fact analysis with Gemini',
      costPerOperation: 0.001,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true,
      requiresApiKey: 'geminiApiKey',
    },
    {
      provider: 'perplexity',
      model: 'sonar-pro',
      displayName: 'Perplexity Sonar Pro',
      description: 'Real-time web verification (best as fallback)',
      costPerOperation: 0.003,
      speedRating: 'medium',
      qualityRating: 'premium',
      recommended: true, // Recommended as fallback
      requiresApiKey: 'perplexityApiKey',
    },
    {
      provider: 'claude',
      model: 'claude-3-5-sonnet-latest',
      displayName: 'Claude 3.5 Sonnet',
      description: 'Most thorough analysis and reasoning',
      costPerOperation: 0.01,
      speedRating: 'medium',
      qualityRating: 'premium',
      recommended: false,
      requiresApiKey: 'claudeCodeApiKey',
    },
  ],

  visualExtraction: [
    {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      displayName: 'Gemini 2.0 Flash (Experimental)',
      description: 'Experimental model optimized for visual element extraction',
      costPerOperation: 0.0001,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true,
      requiresApiKey: 'geminiApiKey',
    },
    {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      description: 'Stable model for visual analysis',
      costPerOperation: 0.0002,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: false,
      requiresApiKey: 'geminiApiKey',
    },
  ],

  imageGeneration: [
    {
      provider: 'dalle',
      model: 'dall-e-3',
      displayName: 'DALL-E 3 (HD)',
      description: 'Highest quality AI-generated images',
      costPerOperation: 0.08,
      speedRating: 'medium',
      qualityRating: 'premium',
      recommended: true,
      requiresApiKey: 'openaiApiKey',
    },
    {
      provider: 'dalle',
      model: 'dall-e-2',
      displayName: 'DALL-E 2',
      description: 'Lower cost, older model',
      costPerOperation: 0.02,
      speedRating: 'fast',
      qualityRating: 'standard',
      recommended: false,
      requiresApiKey: 'openaiApiKey',
      deprecated: true,
      replacementModel: 'dall-e-3',
    },
  ],

  stockPhotoSearch: [
    {
      provider: 'stock-photos',
      model: 'unsplash',
      displayName: 'Unsplash',
      description: 'Free high-quality stock photos (primary)',
      costPerOperation: 0,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true,
      requiresApiKey: 'none',
    },
    {
      provider: 'stock-photos',
      model: 'pexels',
      displayName: 'Pexels',
      description: 'Free stock photos (fallback)',
      costPerOperation: 0,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true, // Recommended as fallback
      requiresApiKey: 'pexelsApiKey',
    },
  ],

  chatAssistant: [
    {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      description: 'Fast, conversational responses for reader chat',
      costPerOperation: 0.0003,
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true,
      requiresApiKey: 'geminiApiKey',
      supportsStreaming: true,
    },
    {
      provider: 'claude',
      model: 'claude-3-haiku-20240307',
      displayName: 'Claude 3 Haiku',
      description: 'Better conversational quality, slightly higher cost',
      costPerOperation: 0.0008,
      speedRating: 'fast',
      qualityRating: 'premium',
      recommended: false,
      requiresApiKey: 'claudeCodeApiKey',
    },
    {
      provider: 'claude',
      model: 'claude-3-5-sonnet-latest',
      displayName: 'Claude 3.5 Sonnet',
      description: 'Most sophisticated chat responses',
      costPerOperation: 0.003,
      speedRating: 'medium',
      qualityRating: 'premium',
      recommended: false,
      requiresApiKey: 'claudeCodeApiKey',
    },
  ],

  textToSpeech: [
    {
      provider: 'elevenlabs',
      model: 'eleven_turbo_v2',
      displayName: 'ElevenLabs Turbo V2',
      description: 'Natural, high-quality voice synthesis',
      costPerOperation: 0.18, // per 1000 characters
      speedRating: 'fast',
      qualityRating: 'premium',
      recommended: true,
      requiresApiKey: 'elevenLabsApiKey',
    },
    {
      provider: 'google-tts',
      model: 'google-neural2-f',
      displayName: 'Google Neural2 (Female)',
      description: 'Free tier available, good quality fallback',
      costPerOperation: 0.016, // per 1000 characters
      speedRating: 'fast',
      qualityRating: 'high',
      recommended: true, // Recommended as fallback
      requiresApiKey: 'geminiApiKey',
    },
    {
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2',
      displayName: 'ElevenLabs Multilingual V2',
      description: 'Supports multiple languages with style control',
      costPerOperation: 0.24, // per 1000 characters
      speedRating: 'medium',
      qualityRating: 'premium',
      recommended: false,
      requiresApiKey: 'elevenLabsApiKey',
    },
  ],

  webSearch: [
    {
      provider: 'perplexity',
      model: 'sonar-pro',
      displayName: 'Perplexity Sonar Pro',
      description: 'Real-time web search with citations',
      costPerOperation: 0.003,
      speedRating: 'medium',
      qualityRating: 'premium',
      recommended: true,
      requiresApiKey: 'perplexityApiKey',
    },
    {
      provider: 'perplexity',
      model: 'sonar',
      displayName: 'Perplexity Sonar',
      description: 'Basic web search, lower cost',
      costPerOperation: 0.001,
      speedRating: 'fast',
      qualityRating: 'standard',
      recommended: false,
      requiresApiKey: 'perplexityApiKey',
    },
  ],
};

/**
 * Feature metadata for UI organization
 */
export const FEATURE_METADATA: Record<AIFeatureKey, FeatureMetadata> = {
  articleGeneration: {
    key: 'articleGeneration',
    category: 'content',
    displayName: 'Article Generation',
    description: 'Generate news articles using AI journalists',
    icon: 'FileText',
  },
  metadataGeneration: {
    key: 'metadataGeneration',
    category: 'content',
    displayName: 'Metadata Generation',
    description: 'Generate SEO descriptions, alt text, and hashtags',
    icon: 'Hash',
  },
  factCheckQuick: {
    key: 'factCheckQuick',
    category: 'quality',
    displayName: 'Quick Fact-Check',
    description: 'Fast fact verification for article reviews',
    icon: 'CheckCircle',
  },
  factCheckDetailed: {
    key: 'factCheckDetailed',
    category: 'quality',
    displayName: 'Detailed Fact-Check',
    description: 'Comprehensive fact-checking with web verification',
    icon: 'ShieldCheck',
  },
  visualExtraction: {
    key: 'visualExtraction',
    category: 'quality',
    displayName: 'Visual Element Extraction',
    description: 'Extract photographable elements for better image generation',
    icon: 'Eye',
  },
  imageGeneration: {
    key: 'imageGeneration',
    category: 'media',
    displayName: 'AI Image Generation',
    description: 'Generate images with DALL-E when stock photos unavailable',
    icon: 'Image',
  },
  stockPhotoSearch: {
    key: 'stockPhotoSearch',
    category: 'media',
    displayName: 'Stock Photo Search',
    description: 'Search for free stock photos from Unsplash and Pexels',
    icon: 'Camera',
  },
  chatAssistant: {
    key: 'chatAssistant',
    category: 'engagement',
    displayName: 'Chat Assistant',
    description: 'AI-powered chat for reader engagement (personas)',
    icon: 'MessageSquare',
  },
  textToSpeech: {
    key: 'textToSpeech',
    category: 'engagement',
    displayName: 'Text-to-Speech',
    description: 'Convert text to natural speech for accessibility',
    icon: 'Volume2',
  },
  webSearch: {
    key: 'webSearch',
    category: 'research',
    displayName: 'Web Search',
    description: 'Real-time web search for current information',
    icon: 'Search',
  },
};

/**
 * Get available models for a specific feature
 */
export function getModelsForFeature(featureKey: AIFeatureKey): ModelOption[] {
  return MODEL_RECOMMENDATIONS[featureKey] || [];
}

/**
 * Get feature metadata
 */
export function getFeatureMetadata(featureKey: AIFeatureKey): FeatureMetadata {
  return FEATURE_METADATA[featureKey];
}

/**
 * Get all features by category
 */
export function getFeaturesByCategory(category: string): AIFeatureKey[] {
  return Object.entries(FEATURE_METADATA)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([key, _]) => key as AIFeatureKey);
}
