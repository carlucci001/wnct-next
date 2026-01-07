import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { AGENT_PROMPTS, AgentType } from '@/data/prompts';

// Types
export interface AgentPromptData {
  id: string;
  agentType: AgentType;
  label: string;
  scope: 'TENANT' | 'PLATFORM';
  instruction: string;
  customized: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

// Collection reference
const COLLECTION = 'agentPrompts';

/**
 * Get all agent prompts - combines defaults with any customizations from Firestore
 */
export async function getAgentPrompts(): Promise<Record<AgentType, AgentPromptData>> {
  // Start with defaults from prompts.ts
  const prompts: Record<string, AgentPromptData> = {};

  for (const [key, value] of Object.entries(AGENT_PROMPTS)) {
    prompts[key] = {
      id: key,
      agentType: key as AgentType,
      label: value.label,
      scope: value.scope as 'TENANT' | 'PLATFORM',
      instruction: value.instruction,
      customized: false,
    };
  }

  // Override with any customizations from Firestore
  try {
    const snapshot = await getDocs(collection(getDb(), COLLECTION));
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (prompts[docSnap.id]) {
        prompts[docSnap.id] = {
          ...prompts[docSnap.id],
          instruction: data.instruction || prompts[docSnap.id].instruction,
          label: data.label || prompts[docSnap.id].label,
          customized: true,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        };
      }
    });
  } catch (error) {
    console.error('Error fetching agent prompts:', error);
    // Return defaults if Firestore fails
  }

  return prompts as Record<AgentType, AgentPromptData>;
}

/**
 * Get a single agent prompt by type
 */
export async function getAgentPrompt(agentType: AgentType): Promise<AgentPromptData> {
  // Get default
  const defaultPrompt = AGENT_PROMPTS[agentType];
  const result: AgentPromptData = {
    id: agentType,
    agentType,
    label: defaultPrompt.label,
    scope: defaultPrompt.scope as 'TENANT' | 'PLATFORM',
    instruction: defaultPrompt.instruction,
    customized: false,
  };

  // Check for customization in Firestore
  try {
    const docRef = doc(getDb(), COLLECTION, agentType);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      result.instruction = data.instruction || result.instruction;
      result.label = data.label || result.label;
      result.customized = true;
      result.updatedAt = data.updatedAt;
      result.updatedBy = data.updatedBy;
    }
  } catch (error) {
    console.error('Error fetching agent prompt:', error);
  }

  return result;
}

/**
 * Update an agent's prompt (saves customization to Firestore)
 */
export async function updateAgentPrompt(
  agentType: AgentType,
  updates: { instruction?: string; label?: string },
  updatedBy: string
): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, agentType);

  await setDoc(docRef, {
    ...updates,
    agentType,
    updatedAt: serverTimestamp(),
    updatedBy,
  }, { merge: true });
}

/**
 * Reset an agent's prompt to default (removes Firestore customization)
 */
export async function resetAgentPrompt(agentType: AgentType): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, agentType);
  const defaultPrompt = AGENT_PROMPTS[agentType];

  // Set to default values with a flag indicating it's been reset
  await setDoc(docRef, {
    agentType,
    instruction: defaultPrompt.instruction,
    label: defaultPrompt.label,
    updatedAt: serverTimestamp(),
    resetToDefault: true,
  });
}

/**
 * Get prompt building tips for partners
 */
export const PROMPT_BUILDING_TIPS = [
  {
    title: "Be Specific About Role",
    tip: "Start with 'You are a...' and clearly define the agent's role and responsibilities.",
    example: "You are a local sports reporter for a Western North Carolina newspaper..."
  },
  {
    title: "Define the Audience",
    tip: "Specify who the agent is writing for to ensure appropriate tone and complexity.",
    example: "Your audience is local community members interested in high school and college sports."
  },
  {
    title: "Set Tone Guidelines",
    tip: "Describe the writing style: formal, conversational, enthusiastic, etc.",
    example: "Write in an engaging, enthusiastic tone that celebrates local athletic achievements."
  },
  {
    title: "Include Constraints",
    tip: "Mention any limitations or things the agent should avoid.",
    example: "Avoid speculation about injuries. Always verify scores from official sources."
  },
  {
    title: "Add Local Context",
    tip: "Include geographic and cultural context relevant to your publication.",
    example: "Focus on Buncombe County schools, UNC Asheville, and regional tournaments."
  },
  {
    title: "Specify Output Format",
    tip: "Define how content should be structured.",
    example: "Structure articles with a compelling headline, lead paragraph with key facts, quotes, and game statistics."
  },
];

/**
 * Prompt templates for common agent types
 */
export const PROMPT_TEMPLATES = {
  journalist: `You are a local news journalist for [NEWSPAPER NAME]. Your coverage area is [GEOGRAPHIC AREA].

Your responsibilities:
- Write accurate, balanced news articles
- Follow AP style guidelines
- Focus on local impact and community relevance
- Include quotes from local sources when possible
- Verify facts before reporting

Your tone should be: [professional/conversational/etc.]

Topics you cover: [LIST BEATS/TOPICS]

Always prioritize accuracy over speed. When uncertain, ask for clarification rather than making assumptions.`,

  editor: `You are the editor for [NEWSPAPER NAME]. Your job is to ensure all content meets our publication standards.

Review articles for:
- Factual accuracy and source verification
- Grammar, spelling, and AP style compliance
- Appropriate tone for our audience
- Local relevance and community impact
- Potential legal issues (libel, defamation)

Provide constructive feedback that helps writers improve. Be specific about changes needed and why.

Our publication voice is: [DESCRIBE VOICE]
Our target audience is: [DESCRIBE AUDIENCE]`,

  social: `You are the social media manager for [NEWSPAPER NAME]. You create engaging posts for [PLATFORMS].

Guidelines:
- Adapt content for each platform's style
- Use relevant local hashtags
- Encourage community engagement
- Keep posts concise and attention-grabbing
- Include calls to action when appropriate

Our brand voice on social: [DESCRIBE SOCIAL VOICE]
Local hashtags to use: [LIST HASHTAGS]

Never post unverified information. All social posts should drive traffic back to our articles.`,

  seo: `You are the SEO specialist for [NEWSPAPER NAME]. You optimize content for search visibility.

Your tasks:
- Generate meta titles (under 60 characters)
- Write meta descriptions (under 160 characters)
- Suggest URL slugs
- Identify relevant keywords
- Recommend internal linking opportunities

Focus on local search terms relevant to [GEOGRAPHIC AREA]. Balance SEO optimization with readability - never sacrifice content quality for keywords.`,
};
