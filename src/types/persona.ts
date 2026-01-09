/**
 * Persona Types
 *
 * Personas are reusable AI identities with customizable skills.
 * They can be assigned to AI Journalists (for article bylines)
 * or used in the Chat Widget (for visitor interactions).
 */

/**
 * Writing style/tone options for personas
 */
export type WritingStyle =
  | 'formal'
  | 'conversational'
  | 'investigative'
  | 'friendly'
  | 'authoritative'
  | 'empathetic';

/**
 * Topic expertise/beat categories
 */
export type TopicExpertise =
  | 'breaking-news'
  | 'politics'
  | 'business'
  | 'sports'
  | 'entertainment'
  | 'lifestyle'
  | 'weather'
  | 'community'
  | 'crime'
  | 'education'
  | 'health'
  | 'technology'
  | 'opinion'
  | 'general';

/**
 * Communication abilities - what the persona can do with users
 */
export interface CommunicationSkills {
  canChat: boolean;              // Can interact via chat widget
  canReceiveTips: boolean;       // Can receive news tips from community
  canRespondToComments: boolean; // Can respond to article comments
}

/**
 * Content capabilities - what content the persona can create
 */
export interface ContentCapabilities {
  canWriteArticles: boolean;     // Can write news articles
  canEditArticles: boolean;      // Can edit/review articles
  canPostSocialMedia: boolean;   // Can post to social media
  canCreateBreakingNews: boolean; // Can create breaking news alerts
  canWriteBlogPosts: boolean;    // Can write blog posts
}

/**
 * Complete skills structure for a persona
 */
export interface PersonaSkills {
  writingStyles: WritingStyle[];           // Multiple styles allowed
  topicExpertise: TopicExpertise[];        // Multiple areas of expertise
  communication: CommunicationSkills;
  content: ContentCapabilities;
}

/**
 * System prompt configuration for AI interactions
 */
export interface PersonaPromptConfig {
  baseSystemPrompt: string;      // Core identity/behavior prompt
  chatGreeting: string;          // Welcome message when starting chat
  chatSignature?: string;        // Optional sign-off for messages
  toneInstructions?: string;     // Additional tone guidance
}

/**
 * ElevenLabs voice configuration for text-to-speech
 */
export interface VoiceConfig {
  voiceId: string;               // ElevenLabs voice ID
  voiceName: string;             // Display name for the voice
  stability?: number;            // Voice stability (0-1, default 0.5)
  similarityBoost?: number;      // Similarity boost (0-1, default 0.75)
  style?: number;                // Style exaggeration (0-1, default 0)
  useSpeakerBoost?: boolean;     // Use speaker boost (default true)
}

/**
 * Default ElevenLabs voices available for selection
 */
export const ELEVENLABS_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Soft, friendly female voice' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm, professional female voice' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Strong, confident female voice' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Well-rounded male voice' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: 'Crisp, authoritative male voice' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep, narrative male voice' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', description: 'Raspy, authentic male voice' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', description: 'Pleasant, British female voice' },
  { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', description: 'Irish male accent' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Articulate, neutral male voice' },
] as const;

/**
 * Main Persona interface
 */
export interface Persona {
  id: string;

  // Core identity
  name: string;                  // Display name, e.g., "Sarah Mitchell"
  photoURL: string;              // Avatar URL (Firebase Storage)
  title: string;                 // Job title, e.g., "Community Reporter"
  bio: string;                   // Short biography (shown in chat/bylines)

  // Skills and capabilities
  skills: PersonaSkills;

  // AI prompt configuration
  promptConfig: PersonaPromptConfig;

  // Status
  isActive: boolean;             // Available for assignment
  isAvailableForChat: boolean;   // Shows in chat persona selector

  // Voice configuration (ElevenLabs)
  voiceConfig?: VoiceConfig;     // Optional TTS voice settings

  // Metadata
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  createdBy: string;             // Admin UID who created

  // SaaS Multi-Tenancy (matching existing patterns)
  tenantId?: string;
}

/**
 * Input type for creating personas (omits auto-generated fields)
 */
export type PersonaInput = Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update type for partial updates
 */
export type PersonaUpdate = Partial<Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Default skills for new personas
 */
export const DEFAULT_PERSONA_SKILLS: PersonaSkills = {
  writingStyles: ['conversational'],
  topicExpertise: ['general'],
  communication: {
    canChat: true,
    canReceiveTips: false,
    canRespondToComments: false,
  },
  content: {
    canWriteArticles: false,
    canEditArticles: false,
    canPostSocialMedia: false,
    canCreateBreakingNews: false,
    canWriteBlogPosts: false,
  },
};

/**
 * Default prompt config for new personas
 */
export const DEFAULT_PERSONA_PROMPT_CONFIG: PersonaPromptConfig = {
  baseSystemPrompt: '',
  chatGreeting: 'Hello! How can I help you today?',
  chatSignature: '',
  toneInstructions: '',
};

/**
 * Writing style labels for UI
 */
export const WRITING_STYLE_OPTIONS: { value: WritingStyle; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Professional, objective tone' },
  { value: 'conversational', label: 'Conversational', description: 'Friendly, approachable tone' },
  { value: 'investigative', label: 'Investigative', description: 'Detailed, fact-driven reporting' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, welcoming communication' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert, confident voice' },
  { value: 'empathetic', label: 'Empathetic', description: 'Understanding, compassionate tone' },
];

/**
 * Topic expertise labels for UI
 */
export const TOPIC_EXPERTISE_OPTIONS: { value: TopicExpertise; label: string }[] = [
  { value: 'breaking-news', label: 'Breaking News' },
  { value: 'politics', label: 'Politics' },
  { value: 'business', label: 'Business' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'weather', label: 'Weather' },
  { value: 'community', label: 'Community' },
  { value: 'crime', label: 'Crime' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'technology', label: 'Technology' },
  { value: 'opinion', label: 'Opinion' },
  { value: 'general', label: 'General Interest' },
];
