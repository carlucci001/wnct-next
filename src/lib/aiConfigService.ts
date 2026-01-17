/**
 * AI Configuration Service
 * Central service layer for AI model configuration and selection
 */

import { getDb } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  AIConfigSettings,
  AIFeatureConfig,
  AIFeatureKey,
  ModelConfig,
} from '@/types/aiConfig';

/**
 * Get AI configuration for a specific feature
 * Falls back to hardcoded defaults if not configured
 */
export async function getFeatureConfig(
  featureKey: AIFeatureKey
): Promise<AIFeatureConfig> {
  try {
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();

    if (settings?.aiConfig?.[featureKey]) {
      return settings.aiConfig[featureKey];
    }

    // Fallback to defaults
    return getDefaultConfig(featureKey);
  } catch (error) {
    console.error(`[AIConfig] Failed to load config for ${featureKey}:`, error);
    return getDefaultConfig(featureKey);
  }
}

/**
 * Get the model and provider for a specific feature
 * Includes fallback logic if primary fails
 */
export async function getModelForFeature(
  featureKey: AIFeatureKey,
  useFallback: boolean = false
): Promise<ModelConfig> {
  const config = await getFeatureConfig(featureKey);

  if (!config.enabled) {
    throw new Error(`Feature ${featureKey} is disabled in AI configuration`);
  }

  const provider =
    useFallback && config.fallbackProvider
      ? config.fallbackProvider
      : config.primaryProvider;

  const model =
    useFallback && config.fallbackModel
      ? config.fallbackModel
      : config.primaryModel;

  return {
    provider,
    model,
    params: {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      ...config.customParams,
    },
  };
}

/**
 * Default configurations for each feature
 * These are used if no configuration is set in Firestore
 */
function getDefaultConfig(featureKey: AIFeatureKey): AIFeatureConfig {
  const defaults: Record<string, AIFeatureConfig> = {
    articleGeneration: {
      enabled: true,
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.5-flash',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
      temperature: 0.3,
      maxTokens: 2000,
    },
    metadataGeneration: {
      enabled: true,
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.0-flash',
      temperature: 0.7,
      maxTokens: 500,
    },
    factCheckQuick: {
      enabled: true,
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.0-flash',
      temperature: 0.3,
      maxTokens: 500,
    },
    factCheckDetailed: {
      enabled: true,
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.0-flash',
      fallbackProvider: 'perplexity',
      fallbackModel: 'sonar-pro',
      temperature: 0.3,
      maxTokens: 2000,
    },
    visualExtraction: {
      enabled: true,
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.0-flash-exp',
      temperature: 0.2,
      maxTokens: 100,
    },
    imageGeneration: {
      enabled: true,
      primaryProvider: 'dalle',
      primaryModel: 'dall-e-3',
      customParams: {
        size: '1792x1024',
        quality: 'hd',
        style: 'natural',
      },
    },
    stockPhotoSearch: {
      enabled: true,
      primaryProvider: 'stock-photos',
      primaryModel: 'unsplash',
      fallbackProvider: 'stock-photos',
      fallbackModel: 'pexels',
    },
    chatAssistant: {
      enabled: true,
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.0-flash',
      temperature: 0.7,
      maxTokens: 500,
    },
    textToSpeech: {
      enabled: true,
      primaryProvider: 'elevenlabs',
      primaryModel: 'eleven_turbo_v2',
      fallbackProvider: 'google-tts',
      fallbackModel: 'google-neural2-f',
    },
    webSearch: {
      enabled: true,
      primaryProvider: 'perplexity',
      primaryModel: 'sonar-pro',
      temperature: 0.2,
      maxTokens: 1000,
    },
  };

  return (
    defaults[featureKey] || {
      enabled: true,
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.0-flash',
    }
  );
}

/**
 * Get all AI configurations at once (for UI display)
 */
export async function getAllAIConfigs(): Promise<AIConfigSettings | null> {
  try {
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();

    return settings?.aiConfig || null;
  } catch (error) {
    console.error('[AIConfig] Failed to load all configs:', error);
    return null;
  }
}

/**
 * Get default configurations for all features (for initialization)
 */
export function getDefaultAIConfigs(): Omit<
  AIConfigSettings,
  'lastUpdated' | 'updatedBy'
> {
  const featureKeys: AIFeatureKey[] = [
    'articleGeneration',
    'metadataGeneration',
    'factCheckQuick',
    'factCheckDetailed',
    'visualExtraction',
    'imageGeneration',
    'stockPhotoSearch',
    'chatAssistant',
    'textToSpeech',
    'webSearch',
  ];

  const config: any = {};
  featureKeys.forEach((key) => {
    config[key] = getDefaultConfig(key);
  });

  return config;
}

/**
 * Check if a specific API key is configured
 */
export async function isApiKeyConfigured(
  apiKeyField: string
): Promise<boolean> {
  try {
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();
    return Boolean(settings?.[apiKeyField]);
  } catch (error) {
    return false;
  }
}

/**
 * Get required API key field name for a provider
 */
export function getRequiredApiKey(provider: string): string {
  const apiKeyMap: Record<string, string> = {
    gemini: 'geminiApiKey',
    claude: 'claudeCodeApiKey',
    openai: 'openaiApiKey',
    dalle: 'openaiApiKey',
    perplexity: 'perplexityApiKey',
    elevenlabs: 'elevenLabsApiKey',
    'google-tts': 'geminiApiKey', // Uses same key as Gemini
    'stock-photos': 'none', // Unsplash/Pexels may or may not need keys
  };

  return apiKeyMap[provider] || 'unknown';
}
