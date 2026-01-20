'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Bot, Plus, Edit2, Trash2, X, Camera, Check, Power, PowerOff, Clock, Calendar, Play, Pause, Zap, Loader2, UserCircle2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { AIJournalist, AIJournalistInput } from '@/types/aiJournalist';
import { CategoryData } from '@/types/article';
import { Category } from '@/types/category';
import { Persona } from '@/types/persona';
import { getAllCategories } from '@/lib/categories';
import { getAllPersonas } from '@/lib/personas';
import {
  getAllAIJournalists,
  createAIJournalist,
  updateAIJournalist,
  deleteAIJournalist,
  toggleAIJournalistStatus,
  formatNextRun,
  toggleScheduleStatus,
} from '@/lib/aiJournalists';
import ScheduleModal from './ScheduleModal';
import ArticleReviewModal, { GeneratedArticleData } from './ArticleReviewModal';
import { QuickFactCheckResult } from '@/types/factCheck';

interface ReviewModalState {
  isOpen: boolean;
  article: GeneratedArticleData | null;
  factCheck: QuickFactCheckResult | null;
  journalist: AIJournalist | null;
  sourceItemId: string | null;
}

interface AIJournalistManagerProps {
  categories: CategoryData[];
  currentUserId: string;
}

interface ModalState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  journalist: AIJournalist | null;
}

interface ScheduleModalState {
  isOpen: boolean;
  journalist: AIJournalist | null;
}

export default function AIJournalistManager({ categories, currentUserId }: AIJournalistManagerProps) {
  const [journalists, setJournalists] = useState<AIJournalist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'add', journalist: null });
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({ isOpen: false, journalist: null });
  const [reviewModal, setReviewModal] = useState<ReviewModalState>({
    isOpen: false,
    article: null,
    factCheck: null,
    journalist: null,
    sourceItemId: null,
  });
  const [fullCategories, setFullCategories] = useState<Category[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [beat, setBeat] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [personaId, setPersonaId] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useFullArticleContent, setUseFullArticleContent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load journalists, categories, and personas on mount
  useEffect(() => {
    loadJournalists();
    loadCategories();
    loadPersonas();
  }, []);

  const loadJournalists = async () => {
    setLoading(true);
    try {
      const data = await getAllAIJournalists();
      setJournalists(data);
    } catch (error) {
      console.error('Error loading AI journalists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories(true);
      setFullCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPersonas = async () => {
    try {
      const data = await getAllPersonas(true);
      setPersonas(data);
    } catch (error) {
      console.error('Error loading personas:', error);
    }
  };

  const openScheduleModal = (journalist: AIJournalist) => {
    setScheduleModal({ isOpen: true, journalist });
  };

  const closeScheduleModal = () => {
    setScheduleModal({ isOpen: false, journalist: null });
  };

  const handleToggleSchedule = async (journalist: AIJournalist) => {
    if (!journalist.schedule) {
      // No schedule configured yet, open modal to configure
      openScheduleModal(journalist);
      return;
    }

    try {
      await toggleScheduleStatus(journalist.id, journalist.schedule.isEnabled);
      await loadJournalists();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      alert('Failed to toggle schedule');
    }
  };

  const openAddModal = () => {
    setName('');
    setTitle('');
    setBeat('');
    setBio('');
    setPhotoURL('');
    setIsActive(true);
    setPersonaId('');
    setUseWebSearch(false);
    setUseFullArticleContent(true);
    setModal({ isOpen: true, mode: 'add', journalist: null });
  };

  const openEditModal = (journalist: AIJournalist) => {
    setName(journalist.name);
    setTitle(journalist.title);
    setBeat(journalist.beat);
    setBio(journalist.bio || '');
    setPhotoURL(journalist.photoURL);
    setIsActive(journalist.isActive);
    setPersonaId(journalist.personaId || '');
    setUseWebSearch(journalist.useWebSearch || false);
    setUseFullArticleContent(journalist.useFullArticleContent ?? true);
    setModal({ isOpen: true, mode: 'edit', journalist });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add', journalist: null });
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
      // Upload to avatars folder which has write permissions in storage rules
      const storageRef = ref(storage, `avatars/ai-journalists/${timestamp}_${file.name}`);
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
      const data: AIJournalistInput = {
        name: name.trim(),
        title: title.trim(),
        beat: beat || '',
        bio: bio.trim(),
        photoURL,
        isActive,
        createdBy: currentUserId,
        agentRole: 'journalist', // Default role for new journalists
        personaId: personaId || undefined,
        useWebSearch,
        useFullArticleContent,
      };

      if (modal.mode === 'add') {
        await createAIJournalist(data);
      } else if (modal.journalist) {
        // Preserve existing schedule and task config when editing
        const updateData = {
          ...data,
          agentRole: modal.journalist.agentRole || 'journalist',
        };
        await updateAIJournalist(modal.journalist.id, updateData);
      }

      await loadJournalists();
      closeModal();
    } catch (error) {
      console.error('Error saving AI journalist:', error);
      alert('Failed to save AI journalist');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (journalist: AIJournalist) => {
    if (!confirm(`Are you sure you want to delete "${journalist.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAIJournalist(journalist.id);
      await loadJournalists();
    } catch (error) {
      console.error('Error deleting AI journalist:', error);
      alert('Failed to delete AI journalist');
    }
  };

  const handleToggleStatus = async (journalist: AIJournalist) => {
    try {
      await toggleAIJournalistStatus(journalist.id, journalist.isActive);
      await loadJournalists();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleRunNow = async (journalist: AIJournalist) => {
    if (runningAgentId) return; // Already running something

    setRunningAgentId(journalist.id);
    try {
      // Run agent and let API save article automatically based on autoPublish setting
      const response = await fetch('/api/scheduled/run-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId: journalist.id, force: true }), // Removed preview: true
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to run agent');
      }

      // Article is now automatically saved by the API
      if (result.results?.[0]?.success) {
        const articleId = result.results[0].articleId;
        const status = result.results[0].status || 'unknown';

        alert(`✅ Article ${status === 'published' ? 'published' : 'saved as draft'} successfully by ${journalist.name}!`);
        await loadJournalists(); // Refresh stats
      } else if (result.results?.[0]?.error) {
        alert(`❌ Error: ${result.results[0].error}`);
      } else {
        alert(result.message || 'Agent run completed');
      }
    } catch (error) {
      console.error('Error running agent:', error);
      alert(error instanceof Error ? error.message : 'Failed to run agent');
    } finally {
      setRunningAgentId(null);
    }
  };

  const handleSaveArticle = async (status: 'draft' | 'published') => {
    if (!reviewModal.article || !reviewModal.journalist) return;

    try {
      const response = await fetch('/api/articles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: {
            ...reviewModal.article,
            author: reviewModal.journalist.name,
            authorId: reviewModal.journalist.id,
            authorPhotoURL: reviewModal.journalist.photoURL || '',
            generatedBy: 'ai-agent',
            factCheckStatus: reviewModal.factCheck?.status || 'not_checked',
            factCheckSummary: reviewModal.factCheck?.summary,
            factCheckConfidence: reviewModal.factCheck?.confidence,
            factCheckedAt: reviewModal.factCheck?.checkedAt,
            factCheckMode: 'quick',
          },
          sourceItemId: reviewModal.sourceItemId,
          agentId: reviewModal.journalist.id,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save article');
      }

      alert(`Article ${status === 'published' ? 'published' : 'saved as draft'} successfully!`);
      setReviewModal({ isOpen: false, article: null, factCheck: null, journalist: null, sourceItemId: null });
      await loadJournalists();
    } catch (error) {
      console.error('Error saving article:', error);
      alert(error instanceof Error ? error.message : 'Failed to save article');
    }
  };

  const handleEditArticle = () => {
    // For now, save as draft and alert user to edit in articles admin
    // In a full implementation, this could open the article editor
    alert('Article will be saved as draft. Edit it in the Articles section.');
    handleSaveArticle('draft');
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, article: null, factCheck: null, journalist: null, sourceItemId: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="text-blue-600" size={28} />
            Agent Manager
          </h2>
          <p className="text-slate-500 mt-1">Create and manage AI journalist personas for article bylines</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Agent
        </button>
      </div>

      {/* Empty State */}
      {journalists.length === 0 && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <Bot className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Agents Yet</h3>
          <p className="text-slate-500 mb-4">Create your first agent to use as an article author</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Create AI Journalist
          </button>
        </div>
      )}

      {/* Journalist Cards Grid */}
      {journalists.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journalists.map((journalist) => (
            <div
              key={journalist.id}
              onClick={() => openEditModal(journalist)}
              className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                !journalist.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                    {journalist.photoURL ? (
                      <Image
                        src={journalist.photoURL}
                        alt={journalist.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        style={{ width: 64, height: 64 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                        {journalist.name[0]?.toUpperCase() || 'A'}
                      </div>
                    )}
                  </div>
                  {/* AI Badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 truncate">{journalist.name}</h3>
                    {!journalist.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{journalist.title}</p>
                  {journalist.beat && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize">
                      {journalist.beat}
                    </span>
                  )}
                </div>
              </div>

              {/* Bio */}
              {journalist.bio && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{journalist.bio}</p>
              )}

              {/* Schedule Status */}
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className={journalist.schedule?.isEnabled ? 'text-green-500' : 'text-slate-400'} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {journalist.schedule?.isEnabled ? 'Autopilot ON' : 'Autopilot OFF'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleSchedule(journalist)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      journalist.schedule?.isEnabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-400'
                    }`}
                    title={journalist.schedule?.isEnabled ? 'Pause autopilot' : 'Start autopilot'}
                  >
                    {journalist.schedule?.isEnabled ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>
                {journalist.schedule?.isEnabled && journalist.nextRunAt && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Next run: {formatNextRun(journalist.nextRunAt, journalist.schedule.timezone)}
                  </div>
                )}
                {journalist.metrics && journalist.metrics.totalArticlesGenerated > 0 && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {journalist.metrics.totalArticlesGenerated} articles generated
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                {/* Run Now Button - Primary Action */}
                <button
                  onClick={() => handleRunNow(journalist)}
                  disabled={runningAgentId !== null || !journalist.isActive}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    runningAgentId === journalist.id
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={!journalist.isActive ? 'Enable agent first' : 'Generate article now'}
                >
                  {runningAgentId === journalist.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Run Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => openEditModal(journalist)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => openScheduleModal(journalist)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Calendar size={14} />
                  Schedule
                </button>
                <button
                  onClick={() => handleToggleStatus(journalist)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    journalist.isActive
                      ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                      : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                  }`}
                  title={journalist.isActive ? 'Deactivate' : 'Activate'}
                >
                  {journalist.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                  {journalist.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(journalist)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center sticky top-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bot size={20} />
                {modal.mode === 'add' ? 'Add Agent' : 'Edit Agent'}
              </h2>
              <button onClick={closeModal} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    {photoURL ? (
                      <Image
                        src={photoURL}
                        alt={name || 'AI Journalist'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        style={{ width: 96, height: 96 }}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {(name?.[0] || 'A').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 shadow-lg"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Alex Chen"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sports Reporter"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Beat (Category) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beat / Category
                </label>
                <select
                  value={beat}
                  onChange={(e) => setBeat(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a beat...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">The topic area this journalist specializes in</p>
              </div>

              {/* Linked Persona */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-2">
                    <UserCircle2 size={16} className="text-violet-600" />
                    Linked Persona
                  </span>
                </label>
                <select
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">No persona linked</option>
                  {personas.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name} - {persona.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Link to a persona for skills, prompts, and chat capabilities
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short biography for this AI journalist..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Article Generation Features - A/B Testing */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                  Article Generation Features (A/B Testing)
                </label>

                {/* Web Search Toggle */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setUseWebSearch(!useWebSearch)}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
                      useWebSearch ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        useWebSearch ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700">
                      Use Web Search (Perplexity)
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enable real-time web search for current information and fact verification
                    </p>
                  </div>
                </div>

                {/* Full Article Content Toggle */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setUseFullArticleContent(!useFullArticleContent)}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
                      useFullArticleContent ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        useFullArticleContent ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700">
                      Fetch Full Article Content
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fetch complete article text from RSS URLs (not just summaries)
                    </p>
                  </div>
                </div>

                <p className="text-xs text-indigo-600 mt-2 pt-2 border-t border-indigo-200">
                  💡 Enable web search to test article quality with real-time information vs. Gemini-only generation
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      isActive ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-700">
                  {isActive ? 'Active - Available for selection' : 'Inactive - Hidden from selection'}
                </span>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 -mx-6 -mb-6 px-6 py-4 flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim() || !title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {modal.mode === 'add' ? 'Create Journalist' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModal.isOpen && scheduleModal.journalist && (
        <ScheduleModal
          journalist={scheduleModal.journalist}
          categories={fullCategories}
          onClose={closeScheduleModal}
          onSaved={loadJournalists}
        />
      )}

      {/* Article Review Modal (after AI generation) */}
      {reviewModal.isOpen && reviewModal.article && reviewModal.journalist && (
        <ArticleReviewModal
          isOpen={reviewModal.isOpen}
          onClose={closeReviewModal}
          article={reviewModal.article}
          factCheckResult={reviewModal.factCheck}
          authorName={reviewModal.journalist.name}
          onSaveDraft={() => handleSaveArticle('draft')}
          onPublish={() => handleSaveArticle('published')}
          onEdit={handleEditArticle}
        />
      )}
    </div>
  );
}
