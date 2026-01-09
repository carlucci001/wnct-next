import { getDb } from './firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
import {
  Persona,
  PersonaInput,
  PersonaUpdate,
  DEFAULT_PERSONA_SKILLS,
  DEFAULT_PERSONA_PROMPT_CONFIG,
  TopicExpertise,
} from '@/types/persona';

const COLLECTION_NAME = 'personas';

/**
 * Fetch all personas
 * @param activeOnly - If true, only return active personas (default: false)
 */
export async function getAllPersonas(activeOnly: boolean = false): Promise<Persona[]> {
  try {
    const querySnapshot = await getDocs(collection(getDb(), COLLECTION_NAME));
    const personas = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        photoURL: data.photoURL || '',
        title: data.title || '',
        bio: data.bio || '',
        skills: data.skills || DEFAULT_PERSONA_SKILLS,
        promptConfig: data.promptConfig || DEFAULT_PERSONA_PROMPT_CONFIG,
        isActive: data.isActive ?? true,
        isAvailableForChat: data.isAvailableForChat ?? false,
        voiceConfig: data.voiceConfig,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        createdBy: data.createdBy || '',
        tenantId: data.tenantId,
      } as Persona;
    });

    // Sort by name
    personas.sort((a, b) => a.name.localeCompare(b.name));

    if (activeOnly) {
      return personas.filter((p) => p.isActive);
    }
    return personas;
  } catch (error) {
    console.error('Error fetching personas:', error);
    return [];
  }
}

/**
 * Fetch personas available for chat
 */
export async function getChatAvailablePersonas(): Promise<Persona[]> {
  try {
    const allPersonas = await getAllPersonas(true);
    return allPersonas.filter((p) => p.isAvailableForChat && p.skills.communication.canChat);
  } catch (error) {
    console.error('Error fetching chat personas:', error);
    return [];
  }
}

/**
 * Fetch personas with specific content capability
 */
export async function getPersonasByContentCapability(
  capability: keyof Persona['skills']['content']
): Promise<Persona[]> {
  try {
    const allPersonas = await getAllPersonas(true);
    return allPersonas.filter((p) => p.skills.content[capability]);
  } catch (error) {
    console.error('Error fetching personas by capability:', error);
    return [];
  }
}

/**
 * Fetch personas by topic expertise
 */
export async function getPersonasByExpertise(expertise: TopicExpertise): Promise<Persona[]> {
  try {
    const allPersonas = await getAllPersonas(true);
    return allPersonas.filter((p) => p.skills.topicExpertise.includes(expertise));
  } catch (error) {
    console.error('Error fetching personas by expertise:', error);
    return [];
  }
}

/**
 * Fetch a single persona by ID
 */
export async function getPersona(id: string): Promise<Persona | null> {
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
      bio: data.bio || '',
      skills: data.skills || DEFAULT_PERSONA_SKILLS,
      promptConfig: data.promptConfig || DEFAULT_PERSONA_PROMPT_CONFIG,
      isActive: data.isActive ?? true,
      isAvailableForChat: data.isAvailableForChat ?? false,
      voiceConfig: data.voiceConfig,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      createdBy: data.createdBy || '',
      tenantId: data.tenantId,
    } as Persona;
  } catch (error) {
    console.error('Error fetching persona:', error);
    return null;
  }
}

/**
 * Create a new persona
 */
export async function createPersona(data: PersonaInput): Promise<string> {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating persona:', error);
    throw error;
  }
}

/**
 * Update an existing persona
 */
export async function updatePersona(id: string, data: PersonaUpdate): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating persona:', error);
    throw error;
  }
}

/**
 * Delete a persona
 */
export async function deletePersona(id: string): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting persona:', error);
    throw error;
  }
}

/**
 * Toggle persona active status
 */
export async function togglePersonaStatus(id: string, currentStatus: boolean): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isActive: !currentStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error toggling persona status:', error);
    throw error;
  }
}

/**
 * Toggle persona chat availability
 */
export async function togglePersonaChatAvailability(
  id: string,
  currentStatus: boolean
): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isAvailableForChat: !currentStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error toggling chat availability:', error);
    throw error;
  }
}

/**
 * Site context for building prompts
 */
interface SiteContext {
  serviceArea: string;
  siteName: string;
}

/**
 * Build a system prompt for chat using persona data
 */
export function buildPersonaChatPrompt(persona: Persona, siteContext?: SiteContext): string {
  const { promptConfig, skills, name, title } = persona;
  const area = siteContext?.serviceArea || 'your local area';
  const site = siteContext?.siteName || 'the news site';

  let prompt = promptConfig.baseSystemPrompt || `You are ${name}, a ${title} for ${site} covering ${area}.`;

  // Add expertise context
  if (skills.topicExpertise.length > 0) {
    prompt += `\n\nYour areas of expertise include: ${skills.topicExpertise.join(', ')} - all focused on ${area}.`;
  }

  // Add writing style context
  if (skills.writingStyles.length > 0) {
    prompt += `\n\nYour communication style is: ${skills.writingStyles.join(', ')}.`;
  }

  // Add tone instructions
  if (promptConfig.toneInstructions) {
    prompt += `\n\nTone guidelines: ${promptConfig.toneInstructions}`;
  }

  // Add capability context
  if (skills.communication.canReceiveTips) {
    prompt += `\n\nYou can receive news tips from readers. Encourage them to share information about local events or stories worth covering in ${area}.`;
  }

  // Add formatting instruction
  prompt += '\n\nIMPORTANT: Do not use markdown formatting like **bold** or *italic* in your responses. Use plain text only.';

  return prompt;
}

/**
 * Seed default personas
 * @returns Number of personas created
 */
export async function seedDefaultPersonas(createdBy: string): Promise<number> {
  // Using Unsplash images - free to use, realistic professional headshots
  const defaultPersonas: PersonaInput[] = [
    {
      name: 'Sarah Mitchell',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      title: 'Community Reporter',
      bio: 'I cover local community events, human interest stories, and help connect neighbors across Western North Carolina.',
      skills: {
        writingStyles: ['conversational', 'friendly', 'empathetic'],
        topicExpertise: ['community', 'lifestyle', 'general'],
        communication: {
          canChat: true,
          canReceiveTips: true,
          canRespondToComments: true,
        },
        content: {
          canWriteArticles: true,
          canEditArticles: false,
          canPostSocialMedia: true,
          canCreateBreakingNews: false,
          canWriteBlogPosts: true,
        },
      },
      promptConfig: {
        baseSystemPrompt: `You are Sarah Mitchell, a friendly and approachable community reporter. You have a warm personality and genuinely care about the local community. You write in a conversational, accessible style that makes readers feel connected. Your focus is on human interest stories, community events, and local happenings that bring people together.`,
        chatGreeting:
          "Hi there! I'm Sarah, your community reporter. I love hearing what's happening in your neighborhood. How can I help you today?",
        chatSignature: '- Sarah',
        toneInstructions:
          'Be warm, welcoming, and genuinely interested in community members. Use friendly language and show enthusiasm for local stories.',
      },
      voiceConfig: {
        voiceId: 'EXAVITQu4vr4xnSDxMaL',
        voiceName: 'Sarah',
        stability: 0.5,
        similarityBoost: 0.75,
      },
      isActive: true,
      isAvailableForChat: true,
      createdBy,
    },
    {
      name: 'Marcus Thompson',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      title: 'Breaking News Editor',
      bio: 'Fast, accurate, and always on top of the latest developments in our region.',
      skills: {
        writingStyles: ['formal', 'authoritative', 'investigative'],
        topicExpertise: ['breaking-news', 'politics', 'crime'],
        communication: {
          canChat: true,
          canReceiveTips: true,
          canRespondToComments: false,
        },
        content: {
          canWriteArticles: true,
          canEditArticles: true,
          canPostSocialMedia: true,
          canCreateBreakingNews: true,
          canWriteBlogPosts: false,
        },
      },
      promptConfig: {
        baseSystemPrompt: `You are Marcus Thompson, a seasoned breaking news editor. You are direct, factual, and prioritize accuracy above all else. You communicate clearly and efficiently, focusing on verified information. Your tone is professional and authoritative without being cold.`,
        chatGreeting:
          "Marcus Thompson here, Breaking News desk. Got a tip or need the latest updates? I'm listening.",
        chatSignature: '- Marcus',
        toneInstructions:
          'Be direct and professional. Stick to facts. Ask clarifying questions when receiving tips.',
      },
      voiceConfig: {
        voiceId: 'VR6AewLTigWG4xSOukaG',
        voiceName: 'Arnold',
        stability: 0.6,
        similarityBoost: 0.8,
      },
      isActive: true,
      isAvailableForChat: true,
      createdBy,
    },
    {
      name: 'Elena Rodriguez',
      photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
      title: 'Sports Correspondent',
      bio: 'Covering high school, college, and local sports with passion and expertise.',
      skills: {
        writingStyles: ['conversational', 'authoritative'],
        topicExpertise: ['sports', 'education', 'community'],
        communication: {
          canChat: true,
          canReceiveTips: true,
          canRespondToComments: true,
        },
        content: {
          canWriteArticles: true,
          canEditArticles: false,
          canPostSocialMedia: true,
          canCreateBreakingNews: false,
          canWriteBlogPosts: true,
        },
      },
      promptConfig: {
        baseSystemPrompt: `You are Elena Rodriguez, an enthusiastic sports correspondent. You bring energy and excitement to local sports coverage, from Friday night football to youth leagues. You know local teams, athletes, and coaches, and you celebrate athletic achievement at every level.`,
        chatGreeting:
          "Hey! Elena here from the Sports desk. Ready to talk local athletics - what's on your mind?",
        chatSignature: '- Elena',
        toneInstructions:
          'Be energetic and passionate about sports while remaining professional. Celebrate local athletic achievements.',
      },
      voiceConfig: {
        voiceId: 'AZnzlk1XvdvUeBnXmlld',
        voiceName: 'Domi',
        stability: 0.45,
        similarityBoost: 0.75,
      },
      isActive: true,
      isAvailableForChat: true,
      createdBy,
    },
    {
      name: 'News Assistant',
      photoURL: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face',
      title: 'Reader Support',
      bio: 'Your helpful guide to navigating our news site and finding the information you need.',
      skills: {
        writingStyles: ['friendly', 'conversational'],
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
      },
      promptConfig: {
        baseSystemPrompt: `You are the News Assistant, a helpful AI for navigating the website and finding news. You help readers find articles, understand website features, and answer general questions about the publication. You are friendly, concise, and focused on being helpful.`,
        chatGreeting:
          "Hi! I'm your News Assistant. I can help you find articles, navigate the site, or answer questions. How can I help?",
        toneInstructions: 'Be helpful, concise, and friendly. Guide users to the information they need.',
      },
      voiceConfig: {
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        voiceName: 'Rachel',
        stability: 0.55,
        similarityBoost: 0.75,
      },
      isActive: true,
      isAvailableForChat: true,
      createdBy,
    },
    {
      name: 'David Chen',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      title: 'Business & Economy Reporter',
      bio: 'Tracking the pulse of local business, economic trends, and entrepreneurship.',
      skills: {
        writingStyles: ['formal', 'authoritative', 'investigative'],
        topicExpertise: ['business', 'technology', 'politics'],
        communication: {
          canChat: true,
          canReceiveTips: true,
          canRespondToComments: false,
        },
        content: {
          canWriteArticles: true,
          canEditArticles: true,
          canPostSocialMedia: false,
          canCreateBreakingNews: false,
          canWriteBlogPosts: true,
        },
      },
      promptConfig: {
        baseSystemPrompt: `You are David Chen, a business and economy reporter. You have expertise in local business developments, economic trends, real estate, and entrepreneurship. You communicate complex financial topics in accessible terms while maintaining analytical rigor.`,
        chatGreeting:
          'David Chen, Business desk. Interested in local business news or have a story lead? Let\'s talk.',
        chatSignature: '- David',
        toneInstructions:
          'Be professional and analytical. Make complex business topics accessible to general readers.',
      },
      voiceConfig: {
        voiceId: 'pNInz6obpgDQGcFmaJgB',
        voiceName: 'Adam',
        stability: 0.6,
        similarityBoost: 0.8,
      },
      isActive: true,
      isAvailableForChat: false, // Available for articles but not general chat
      createdBy,
    },
  ];

  let created = 0;
  for (const persona of defaultPersonas) {
    try {
      await createPersona(persona);
      created++;
    } catch (error) {
      console.error(`Error creating persona ${persona.name}:`, error);
    }
  }
  return created;
}

/**
 * Check if any personas exist
 */
export async function hasPersonas(): Promise<boolean> {
  try {
    const personas = await getAllPersonas();
    return personas.length > 0;
  } catch (error) {
    console.error('Error checking for personas:', error);
    return false;
  }
}
