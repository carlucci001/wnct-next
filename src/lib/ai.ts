import OpenAI from 'openai';
import { config } from './config';

// Initialize OpenAI client only if API key is present to avoid runtime errors during build/start if not configured
// However, the OpenAI constructor throws if apiKey is missing unless we pass `dangerouslyAllowBrowser: true` (which we shouldn't)
// or just handle it gracefully.
// We will return null if no key is present.

let openai: OpenAI | null = null;

if (config.openai.apiKey) {
  openai = new OpenAI({
    apiKey: config.openai.apiKey,
  });
}

export { openai };

export const isAIConfigured = () => !!openai;
