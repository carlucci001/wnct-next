'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  UserCircle2,
  Plus,
  Edit2,
  Trash2,
  X,
  Camera,
  Check,
  Power,
  PowerOff,
  MessageSquare,
  MessageSquareOff,
  Loader2,
  Sparkles,
  PenTool,
  Newspaper,
  Share2,
  Zap,
  Users,
  LayoutGrid,
  List,
  Filter,
  XCircle,
  Volume2,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import {
  Persona,
  PersonaInput,
  PersonaSkills,
  WritingStyle,
  TopicExpertise,
  CommunicationSkills,
  ContentCapabilities,
  VoiceConfig,
  DEFAULT_PERSONA_SKILLS,
  DEFAULT_PERSONA_PROMPT_CONFIG,
  WRITING_STYLE_OPTIONS,
  TOPIC_EXPERTISE_OPTIONS,
  ELEVENLABS_VOICES,
} from '@/types/persona';
import {
  getAllPersonas,
  createPersona,
  updatePersona,
  deletePersona,
  togglePersonaStatus,
  togglePersonaChatAvailability,
  seedDefaultPersonas,
  hasPersonas,
} from '@/lib/personas';

interface PersonaManagerProps {
  currentUserId: string;
}

interface ModalState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  persona: Persona | null;
}

type ModalTab = 'identity' | 'skills' | 'abilities' | 'prompts' | 'voice';
type ViewMode = 'card' | 'list';

export default function PersonaManager({ currentUserId }: PersonaManagerProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'add', persona: null });
  const [activeTab, setActiveTab] = useState<ModalTab>('identity');
  const [seeding, setSeeding] = useState(false);
  const [showSeedButton, setShowSeedButton] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterChat, setFilterChat] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [filterExpertise, setFilterExpertise] = useState<TopicExpertise[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Form state - Identity
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isAvailableForChat, setIsAvailableForChat] = useState(false);

  // Form state - Skills
  const [writingStyles, setWritingStyles] = useState<WritingStyle[]>(['conversational']);
  const [topicExpertise, setTopicExpertise] = useState<TopicExpertise[]>(['general']);

  // Form state - Abilities
  const [communication, setCommunication] = useState<CommunicationSkills>({
    canChat: true,
    canReceiveTips: false,
    canRespondToComments: false,
  });
  const [content, setContent] = useState<ContentCapabilities>({
    canWriteArticles: false,
    canEditArticles: false,
    canPostSocialMedia: false,
    canCreateBreakingNews: false,
    canWriteBlogPosts: false,
  });

  // Form state - Prompts
  const [baseSystemPrompt, setBaseSystemPrompt] = useState('');
  const [chatGreeting, setChatGreeting] = useState('');
  const [chatSignature, setChatSignature] = useState('');
  const [toneInstructions, setToneInstructions] = useState('');

  // Form state - Voice
  const [voiceId, setVoiceId] = useState('');
  const [voiceStability, setVoiceStability] = useState(0.5);
  const [voiceSimilarity, setVoiceSimilarity] = useState(0.75);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load personas on mount
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setLoading(true);
    try {
      const data = await getAllPersonas();
      setPersonas(data);
      setShowSeedButton(data.length === 0);
    } catch (error) {
      console.error('Error loading personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    const hasExisting = personas.length > 0;
    const message = hasExisting
      ? 'This will DELETE all existing personas and create 5 new default personas with photos. Continue?'
      : 'This will create 5 default personas with photos. Continue?';

    if (!confirm(message)) return;

    setSeeding(true);
    try {
      // Delete existing personas first if any
      if (hasExisting) {
        for (const persona of personas) {
          await deletePersona(persona.id);
        }
      }

      const count = await seedDefaultPersonas(currentUserId);
      alert(`Successfully created ${count} default personas with photos!`);
      await loadPersonas();
    } catch (error) {
      console.error('Error seeding personas:', error);
      alert('Failed to seed default personas');
    } finally {
      setSeeding(false);
    }
  };

  const resetForm = () => {
    setName('');
    setTitle('');
    setBio('');
    setPhotoURL('');
    setIsActive(true);
    setIsAvailableForChat(false);
    setWritingStyles(['conversational']);
    setTopicExpertise(['general']);
    setCommunication({
      canChat: true,
      canReceiveTips: false,
      canRespondToComments: false,
    });
    setContent({
      canWriteArticles: false,
      canEditArticles: false,
      canPostSocialMedia: false,
      canCreateBreakingNews: false,
      canWriteBlogPosts: false,
    });
    setBaseSystemPrompt('');
    setChatGreeting('');
    setChatSignature('');
    setToneInstructions('');
    setVoiceId('');
    setVoiceStability(0.5);
    setVoiceSimilarity(0.75);
    setActiveTab('identity');
  };

  const openAddModal = () => {
    resetForm();
    setModal({ isOpen: true, mode: 'add', persona: null });
  };

  const openEditModal = (persona: Persona) => {
    setName(persona.name);
    setTitle(persona.title);
    setBio(persona.bio);
    setPhotoURL(persona.photoURL);
    setIsActive(persona.isActive);
    setIsAvailableForChat(persona.isAvailableForChat);
    setWritingStyles(persona.skills.writingStyles);
    setTopicExpertise(persona.skills.topicExpertise);
    setCommunication(persona.skills.communication);
    setContent(persona.skills.content);
    setBaseSystemPrompt(persona.promptConfig.baseSystemPrompt);
    setChatGreeting(persona.promptConfig.chatGreeting);
    setChatSignature(persona.promptConfig.chatSignature || '');
    setToneInstructions(persona.promptConfig.toneInstructions || '');
    setVoiceId(persona.voiceConfig?.voiceId || '');
    setVoiceStability(persona.voiceConfig?.stability ?? 0.5);
    setVoiceSimilarity(persona.voiceConfig?.similarityBoost ?? 0.75);
    setActiveTab('identity');
    setModal({ isOpen: true, mode: 'edit', persona });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add', persona: null });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `avatars/personas/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !title.trim()) {
      alert('Name and Title are required');
      return;
    }

    setSaving(true);
    try {
      const skills: PersonaSkills = {
        writingStyles,
        topicExpertise,
        communication,
        content,
      };

      // Build promptConfig without undefined values (Firestore doesn't accept undefined)
      const promptConfigData: PersonaInput['promptConfig'] = {
        baseSystemPrompt: baseSystemPrompt.trim(),
        chatGreeting: chatGreeting.trim() || 'Hello! How can I help you today?',
      };
      if (chatSignature.trim()) {
        promptConfigData.chatSignature = chatSignature.trim();
      }
      if (toneInstructions.trim()) {
        promptConfigData.toneInstructions = toneInstructions.trim();
      }

      // Build voiceConfig if a voice is selected
      let voiceConfigData: VoiceConfig | undefined;
      if (voiceId) {
        const selectedVoice = ELEVENLABS_VOICES.find((v) => v.id === voiceId);
        voiceConfigData = {
          voiceId,
          voiceName: selectedVoice?.name || 'Unknown',
          stability: voiceStability,
          similarityBoost: voiceSimilarity,
        };
      }

      const data: PersonaInput = {
        name: name.trim(),
        title: title.trim(),
        bio: bio.trim(),
        photoURL,
        skills,
        promptConfig: promptConfigData,
        isActive,
        isAvailableForChat,
        createdBy: currentUserId,
        ...(voiceConfigData && { voiceConfig: voiceConfigData }),
      };

      if (modal.mode === 'add') {
        await createPersona(data);
      } else if (modal.persona) {
        await updatePersona(modal.persona.id, data);
      }

      await loadPersonas();
      closeModal();
    } catch (error) {
      console.error('Error saving persona:', error);
      alert('Failed to save persona');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (persona: Persona) => {
    if (!confirm(`Are you sure you want to delete "${persona.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePersona(persona.id);
      await loadPersonas();
    } catch (error) {
      console.error('Error deleting persona:', error);
      alert('Failed to delete persona');
    }
  };

  const handleToggleStatus = async (persona: Persona) => {
    try {
      await togglePersonaStatus(persona.id, persona.isActive);
      await loadPersonas();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleToggleChat = async (persona: Persona) => {
    try {
      await togglePersonaChatAvailability(persona.id, persona.isAvailableForChat);
      await loadPersonas();
    } catch (error) {
      console.error('Error toggling chat availability:', error);
      alert('Failed to update chat availability');
    }
  };

  const toggleWritingStyle = (style: WritingStyle) => {
    setWritingStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleExpertise = (expertise: TopicExpertise) => {
    setTopicExpertise((prev) =>
      prev.includes(expertise) ? prev.filter((e) => e !== expertise) : [...prev, expertise]
    );
  };

  // Filter helpers
  const toggleFilterExpertise = (expertise: TopicExpertise) => {
    setFilterExpertise((prev) =>
      prev.includes(expertise) ? prev.filter((e) => e !== expertise) : [...prev, expertise]
    );
  };

  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterChat('all');
    setFilterExpertise([]);
  };

  const hasActiveFilters = filterStatus !== 'all' || filterChat !== 'all' || filterExpertise.length > 0;

  // Apply filters to personas
  const filteredPersonas = personas.filter((persona) => {
    // Status filter
    if (filterStatus === 'active' && !persona.isActive) return false;
    if (filterStatus === 'inactive' && persona.isActive) return false;

    // Chat filter
    if (filterChat === 'enabled' && !persona.isAvailableForChat) return false;
    if (filterChat === 'disabled' && persona.isAvailableForChat) return false;

    // Expertise filter (persona must have at least one of the selected expertise areas)
    if (filterExpertise.length > 0) {
      const hasMatchingExpertise = filterExpertise.some((exp) =>
        persona.skills.topicExpertise.includes(exp)
      );
      if (!hasMatchingExpertise) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCircle2 className="text-violet-600" size={28} />
            Persona Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create and manage AI personas for journalists and chat assistants
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-violet-600 text-white rounded-full">
                {(filterStatus !== 'all' ? 1 : 0) + (filterChat !== 'all' ? 1 : 0) + filterExpertise.length}
              </span>
            )}
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-600 text-violet-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-600 text-violet-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>

          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {personas.length > 0 ? 'Reseed Defaults' : 'Seed Defaults'}
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus size={18} />
            Add Persona
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
              <Filter size={16} />
              Filter Personas
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1"
              >
                <XCircle size={14} />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
                      filterStatus === status
                        ? 'bg-violet-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-violet-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Chat Availability
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'all', label: 'All' },
                  { value: 'enabled', label: 'Chat Enabled' },
                  { value: 'disabled', label: 'Chat Disabled' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterChat(option.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filterChat === option.value
                        ? 'bg-violet-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-violet-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expertise Filter - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Topic Expertise
                {filterExpertise.length > 0 && (
                  <span className="ml-2 text-xs text-violet-600">({filterExpertise.length} selected)</span>
                )}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {TOPIC_EXPERTISE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleFilterExpertise(option.value)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      filterExpertise.includes(option.value)
                        ? 'bg-violet-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-violet-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
            Showing {filteredPersonas.length} of {personas.length} personas
          </div>
        </div>
      )}

      {/* Empty State */}
      {personas.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <UserCircle2 className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Personas Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Create your first persona or seed default personas to get started
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50"
            >
              {seeding ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Seed Defaults
            </button>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              <Plus size={18} />
              Create Persona
            </button>
          </div>
        </div>
      )}

      {/* No Results State (when filters are applied) */}
      {personas.length > 0 && filteredPersonas.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
          <Filter className="mx-auto text-slate-400 mb-3" size={40} />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Matching Personas
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No personas match your current filters. Try adjusting your filter criteria.
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            <XCircle size={18} />
            Clear All Filters
          </button>
        </div>
      )}

      {/* Persona Display - Card or List View */}
      {filteredPersonas.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonas.map((persona) => (
            <div
              key={persona.id}
              onClick={() => openEditModal(persona)}
              className={`bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                !persona.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-500">
                    {persona.photoURL ? (
                      <Image
                        src={persona.photoURL}
                        alt={persona.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                        {persona.name[0]?.toUpperCase() || 'P'}
                      </div>
                    )}
                  </div>
                  {/* Chat Badge */}
                  {persona.isAvailableForChat && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <MessageSquare size={12} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {persona.name}
                    </h3>
                    {persona.voiceConfig && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1">
                        <Volume2 size={10} />
                        {persona.voiceConfig.voiceName}
                      </span>
                    )}
                    {!persona.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{persona.title}</p>
                </div>
              </div>

              {/* Skills Badges */}
              <div className="mt-3 flex flex-wrap gap-1">
                {persona.skills.topicExpertise.slice(0, 3).map((expertise) => (
                  <span
                    key={expertise}
                    className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full capitalize"
                  >
                    {expertise.replace('-', ' ')}
                  </span>
                ))}
                {persona.skills.topicExpertise.length > 3 && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                    +{persona.skills.topicExpertise.length - 3}
                  </span>
                )}
              </div>

              {/* Capability Icons */}
              <div className="mt-3 flex items-center gap-3 text-slate-400">
                {persona.skills.content.canWriteArticles && (
                  <div className="flex items-center gap-1" title="Can write articles">
                    <Newspaper size={14} className="text-blue-500" />
                  </div>
                )}
                {persona.skills.content.canPostSocialMedia && (
                  <div className="flex items-center gap-1" title="Can post to social media">
                    <Share2 size={14} className="text-pink-500" />
                  </div>
                )}
                {persona.skills.content.canCreateBreakingNews && (
                  <div className="flex items-center gap-1" title="Can create breaking news">
                    <Zap size={14} className="text-amber-500" />
                  </div>
                )}
                {persona.skills.communication.canReceiveTips && (
                  <div className="flex items-center gap-1" title="Can receive tips">
                    <Users size={14} className="text-green-500" />
                  </div>
                )}
              </div>

              {/* Bio Preview */}
              {persona.bio && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                  {persona.bio}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditModal(persona)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleChat(persona)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    persona.isAvailableForChat
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  title={persona.isAvailableForChat ? 'Disable chat' : 'Enable chat'}
                >
                  {persona.isAvailableForChat ? (
                    <MessageSquare size={14} />
                  ) : (
                    <MessageSquareOff size={14} />
                  )}
                  Chat
                </button>
                <button
                  onClick={() => handleToggleStatus(persona)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    persona.isActive
                      ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                      : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                  }`}
                  title={persona.isActive ? 'Deactivate' : 'Activate'}
                >
                  {persona.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                  {persona.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(persona)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {filteredPersonas.length > 0 && viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Expertise
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Chat
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPersonas.map((persona) => (
                <tr
                  key={persona.id}
                  onClick={() => openEditModal(persona)}
                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                    !persona.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-500 flex-shrink-0">
                        {persona.photoURL ? (
                          <Image
                            src={persona.photoURL}
                            alt={persona.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                            {persona.name[0]?.toUpperCase() || 'P'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {persona.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {persona.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {persona.skills.topicExpertise.slice(0, 2).map((expertise) => (
                        <span
                          key={expertise}
                          className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full capitalize"
                        >
                          {expertise.replace('-', ' ')}
                        </span>
                      ))}
                      {persona.skills.topicExpertise.length > 2 && (
                        <span className="text-xs text-slate-500">
                          +{persona.skills.topicExpertise.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleChat(persona)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        persona.isAvailableForChat
                          ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700'
                      }`}
                      title={persona.isAvailableForChat ? 'Chat enabled' : 'Chat disabled'}
                    >
                      {persona.isAvailableForChat ? (
                        <MessageSquare size={16} />
                      ) : (
                        <MessageSquareOff size={16} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(persona)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        persona.isActive
                          ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700'
                      }`}
                      title={persona.isActive ? 'Active' : 'Inactive'}
                    >
                      {persona.isActive ? <Power size={16} /> : <PowerOff size={16} />}
                    </button>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(persona)}
                        className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(persona)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCircle2 size={20} />
                {modal.mode === 'add' ? 'Add Persona' : 'Edit Persona'}
              </h2>
              <button onClick={closeModal} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex">
                {(['identity', 'skills', 'abilities', 'prompts', 'voice'] as ModalTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-violet-600 border-b-2 border-violet-600'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Identity Tab */}
              {activeTab === 'identity' && (
                <>
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        {photoURL ? (
                          <Image
                            src={photoURL}
                            alt={name || 'Persona'}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {(name?.[0] || 'P').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 p-2 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 shadow-lg"
                        title="Upload avatar"
                      >
                        {uploading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Camera size={16} />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Click to upload avatar</p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sarah Mitchell"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-700 dark:text-white"
                      required
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Community Reporter"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-700 dark:text-white"
                      required
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Short biography for this persona..."
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-700 dark:text-white resize-none"
                    />
                  </div>

                  {/* Status Toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          isActive ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            isActive ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Available for Chat
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAvailableForChat(!isAvailableForChat)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          isAvailableForChat ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            isAvailableForChat ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <>
                  {/* Writing Styles */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Writing Styles
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {WRITING_STYLE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleWritingStyle(option.value)}
                          className={`p-3 text-left rounded-lg border transition-colors ${
                            writingStyles.includes(option.value)
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                writingStyles.includes(option.value)
                                  ? 'bg-violet-600 border-violet-600'
                                  : 'border-slate-300 dark:border-slate-500'
                              }`}
                            >
                              {writingStyles.includes(option.value) && (
                                <Check size={12} className="text-white" />
                              )}
                            </div>
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                            {option.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topic Expertise */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Topic Expertise
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TOPIC_EXPERTISE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleExpertise(option.value)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            topicExpertise.includes(option.value)
                              ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                              : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Abilities Tab */}
              {activeTab === 'abilities' && (
                <>
                  {/* Communication Skills */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Communication Skills
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'canChat', label: 'Can Chat with Visitors', icon: MessageSquare },
                        { key: 'canReceiveTips', label: 'Can Receive News Tips', icon: Users },
                        { key: 'canRespondToComments', label: 'Can Respond to Comments', icon: PenTool },
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon size={18} className="text-slate-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCommunication((prev) => ({
                                ...prev,
                                [key]: !prev[key as keyof CommunicationSkills],
                              }))
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              communication[key as keyof CommunicationSkills]
                                ? 'bg-green-600'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                communication[key as keyof CommunicationSkills] ? 'left-7' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Capabilities */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Content Capabilities
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'canWriteArticles', label: 'Can Write Articles', icon: Newspaper },
                        { key: 'canEditArticles', label: 'Can Edit/Review Articles', icon: Edit2 },
                        { key: 'canPostSocialMedia', label: 'Can Post to Social Media', icon: Share2 },
                        { key: 'canCreateBreakingNews', label: 'Can Create Breaking News', icon: Zap },
                        { key: 'canWriteBlogPosts', label: 'Can Write Blog Posts', icon: PenTool },
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon size={18} className="text-slate-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setContent((prev) => ({
                                ...prev,
                                [key]: !prev[key as keyof ContentCapabilities],
                              }))
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              content[key as keyof ContentCapabilities]
                                ? 'bg-blue-600'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                content[key as keyof ContentCapabilities] ? 'left-7' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Prompts Tab */}
              {activeTab === 'prompts' && (
                <>
                  {/* Base System Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Base System Prompt
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      The core identity and behavior instructions for this persona
                    </p>
                    <textarea
                      value={baseSystemPrompt}
                      onChange={(e) => setBaseSystemPrompt(e.target.value)}
                      placeholder="You are [Name], a [title] who..."
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-700 dark:text-white resize-none font-mono text-sm"
                    />
                  </div>

                  {/* Chat Greeting */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Chat Greeting
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      The welcome message when starting a chat
                    </p>
                    <textarea
                      value={chatGreeting}
                      onChange={(e) => setChatGreeting(e.target.value)}
                      placeholder="Hi! I'm [Name]. How can I help you today?"
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-700 dark:text-white resize-none"
                    />
                  </div>

                  {/* Chat Signature */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Chat Signature (Optional)
                    </label>
                    <input
                      type="text"
                      value={chatSignature}
                      onChange={(e) => setChatSignature(e.target.value)}
                      placeholder="e.g., - Sarah"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* Tone Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tone Instructions (Optional)
                    </label>
                    <textarea
                      value={toneInstructions}
                      onChange={(e) => setToneInstructions(e.target.value)}
                      placeholder="Additional guidance on how this persona should communicate..."
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-700 dark:text-white resize-none"
                    />
                  </div>
                </>
              )}

              {/* Voice Tab */}
              {activeTab === 'voice' && (
                <>
                  <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 mb-2">
                      <Volume2 size={18} />
                      <span className="font-medium">ElevenLabs Voice</span>
                    </div>
                    <p className="text-sm text-violet-600 dark:text-violet-400">
                      Assign a voice to this persona for text-to-speech capabilities in chat and audio content.
                    </p>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Select Voice
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setVoiceId('')}
                        className={`p-3 text-left rounded-lg border transition-colors ${
                          !voiceId
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                            : 'border-slate-200 dark:border-slate-600 hover:border-violet-300'
                        }`}
                      >
                        <div className="font-medium text-slate-900 dark:text-white text-sm">No Voice</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Text only</div>
                      </button>
                      {ELEVENLABS_VOICES.map((voice) => (
                        <button
                          key={voice.id}
                          type="button"
                          onClick={() => setVoiceId(voice.id)}
                          className={`p-3 text-left rounded-lg border transition-colors ${
                            voiceId === voice.id
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                              : 'border-slate-200 dark:border-slate-600 hover:border-violet-300'
                          }`}
                        >
                          <div className="font-medium text-slate-900 dark:text-white text-sm">{voice.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{voice.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice Settings (only shown when a voice is selected) */}
                  {voiceId && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Stability: {Math.round(voiceStability * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={voiceStability}
                          onChange={(e) => setVoiceStability(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Higher stability makes the voice more consistent but less expressive
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Similarity Boost: {Math.round(voiceSimilarity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={voiceSimilarity}
                          onChange={(e) => setVoiceSimilarity(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Higher values make the voice closer to the original but may increase artifacts
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 flex justify-end gap-3 flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim() || !title.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {modal.mode === 'add' ? 'Create Persona' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
