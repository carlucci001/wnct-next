'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Article } from '@/types/article';
import {
  LayoutDashboard, FileText, Settings, Users, Database,
  Plus, Trash2, Edit, Save, X, RefreshCw, CheckCircle, LogOut,
  Search, Image as ImageIcon, Eye, EyeOff, Bell, HelpCircle,
  Download, Cloud, Palette, ExternalLink, MessageCircle, Activity,
  ChevronDown, BarChart3, Clock, TrendingUp, Zap, PenTool,
  MessageSquare, UserPlus, ListOrdered, Server, Plug, Shield,
  Sparkles, DollarSign, AlertCircle, Info, Bot, ShieldAlert, Share2,
  Send, Lightbulb, Folder, FolderPlus, Upload, Sliders, Terminal, ArrowRight
} from 'lucide-react';
import { AGENT_PROMPTS, AgentType } from '@/data/prompts';
import { ROLE_PERMISSIONS, ROLE_LABELS, ROLE_DESCRIPTIONS, PERMISSION_LABELS, UserRole, UserPermissions } from '@/data/rolePermissions';
import { storageService } from '@/lib/storage';

type TabType = 'dashboard' | 'articles' | 'categories' | 'media' | 'users' | 'roles' | 'settings' | 'api-config' | 'infrastructure' | 'MASTER' | 'JOURNALIST' | 'EDITOR' | 'SEO' | 'SOCIAL';

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  reviewArticles: number;
  totalViews: number;
  categoryCounts: Record<string, number>;
}

interface SiteSettings {
  siteName: string;
  tagline: string;
  primaryColor: string;
  articlesPerPage: number;
  serviceArea: string;
  targetAudience: string;
  logoUrl?: string;
  brandingMode?: 'text' | 'logo';
  showTagline?: boolean;
  defaultArticleStatus?: string;
  // API Keys
  openaiApiKey?: string;
  geminiApiKey?: string;
  weatherApiKey?: string;
  defaultLocation?: string;
  // DALL-E Settings
  dalleQuality?: 'standard' | 'hd';
  dalleStyle?: 'natural' | 'vivid';
  dalleSize?: '1024x1024' | '1792x1024' | '1024x1792';
  // Gemini Settings
  geminiModel?: string;
}

interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: string;
  lastLogin?: string;
}

interface MenuSections {
  ai: boolean;
  content: boolean;
  components: boolean;
  users: boolean;
  systemSettings: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface MediaFile {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  thumbnailData: string;
  fullData: string;
  uploadedAt: Date;
  uploadedBy: string;
  altText?: string;
  caption?: string;
  folder: string;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  count: number;
  color: string;
  editorialPrompt?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'WNC Times',
  tagline: 'Your trusted source for Western North Carolina news',
  primaryColor: '#1d4ed8',
  articlesPerPage: 10,
  serviceArea: 'Western North Carolina',
  targetAudience: 'Local residents and visitors',
};

const NEWSROOM_VERSION = '2.0';

export default function AdminDashboard() {
  const { currentUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    reviewArticles: 0,
    totalViews: 0,
    categoryCounts: {},
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'title' | 'category' | 'status' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuSections, setMenuSections] = useState<MenuSections>({
    ai: true,
    content: true,
    components: true,
    users: true,
    systemSettings: true,
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // AI Agent states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Categories and Media states
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('/');
  const [mediaSearch, setMediaSearch] = useState('');

  // AI Workflow states
  const [selectedResearchTopic, setSelectedResearchTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [articleSuggestions, setArticleSuggestions] = useState<Array<{title: string, summary: string, angle: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editorAiLoading, setEditorAiLoading] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<'research' | 'draft' | 'review' | 'grammar' | 'approve' | null>(null);
  const [selectedArticleForAction, setSelectedArticleForAction] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Agent Article Editor states
  const [agentArticle, setAgentArticle] = useState<Article | null>(null);
  const [agentTab, setAgentTab] = useState<'settings' | 'content' | 'media' | 'options'>('settings');

  // Status Modal for AI generation progress
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalMessage, setStatusModalMessage] = useState('');
  const [statusModalIcon, setStatusModalIcon] = useState('🔍');

  // API Configuration state
  const [apiConfigTab, setApiConfigTab] = useState<'openai' | 'google' | 'weather' | 'payments'>('openai');

  // Roles & Permissions state
  const [customRolePermissions, setCustomRolePermissions] = useState<Record<UserRole, UserPermissions>>(ROLE_PERMISSIONS);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const articlesSnapshot = await getDocs(collection(db, 'articles'));
      const arts = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];
      setArticles(arts);

      const published = arts.filter(a => a.status?.toLowerCase() === 'published').length;
      const drafts = arts.filter(a => a.status?.toLowerCase() === 'draft').length;
      const review = arts.filter(a => a.status?.toLowerCase() === 'review').length;
      const views = arts.reduce((sum, a) => sum + (a.views || 0), 0);
      const catCounts: Record<string, number> = {};
      arts.forEach(a => {
        const cat = a.category || 'Uncategorized';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });

      setStats({
        totalArticles: arts.length,
        publishedArticles: published,
        draftArticles: drafts,
        reviewArticles: review,
        totalViews: views,
        categoryCounts: catCounts,
      });

      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as SiteSettings;
          console.log('[Admin] Loaded settings from Firestore - logoUrl exists:', !!data.logoUrl, 'length:', data.logoUrl?.length || 0, 'brandingMode:', data.brandingMode);
          const mergedSettings = { ...DEFAULT_SETTINGS, ...data };
          setSettings(mergedSettings);
          // Sync to localStorage for frontend components (ChatAssistant, etc.)
          localStorage.setItem('wnc_settings', JSON.stringify(mergedSettings));
        } else {
          console.log('[Admin] No settings document found in Firestore');
        }
      } catch (err) {
        console.error('[Admin] Failed to load settings:', err);
      }

      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const loadedUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AppUser[];
        setUsers(loadedUsers);
      } catch (err) {
        console.error('Failed to load users:', err);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteDoc(doc(db, 'articles', articleId));
      setArticles(articles.filter(a => a.id !== articleId));
      showMessage('success', 'Article deleted successfully');
    } catch (error) {
      console.error('Failed to delete article:', error);
      showMessage('error', 'Failed to delete article');
    }
  };

  const handleTogglePublish = async (article: Article) => {
    const newStatus = article.status?.toLowerCase() === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'articles', article.id), { status: newStatus });
      setArticles(articles.map(a =>
        a.id === article.id ? { ...a, status: newStatus } : a
      ));
      showMessage('success', `Article ${newStatus === 'published' ? 'published' : 'unpublished'}`);
    } catch (error) {
      console.error('Failed to update article:', error);
      showMessage('error', 'Failed to update article');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      console.log('[Admin] Saving settings - logoUrl exists:', !!settings.logoUrl, 'length:', settings.logoUrl?.length || 0, 'brandingMode:', settings.brandingMode);
      await setDoc(doc(db, 'settings', 'config'), settings);

      // Also save to localStorage for frontend components (ChatAssistant, etc.)
      localStorage.setItem('wnc_settings', JSON.stringify(settings));

      showMessage('success', 'Settings saved to Cloud successfully');
    } catch (error) {
      console.error('[Admin] Failed to save settings:', error);
      showMessage('error', `Failed to save settings: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    const data = { articles, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wnc-times-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('success', 'Data exported successfully');
  };

  const toggleMenuSection = (section: keyof MenuSections) => {
    setMenuSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // AI Agent helpers
  const isAgentView = (tab: string): boolean => {
    return Object.keys(AGENT_PROMPTS).includes(tab);
  };

  const getAgentIcon = (type: string) => {
    switch(type) {
      case 'MASTER': return <ShieldAlert size={16} className="mr-3 text-indigo-600"/>;
      case 'JOURNALIST': return <PenTool size={16} className="mr-3 text-blue-600"/>;
      case 'EDITOR': return <CheckCircle size={16} className="mr-3 text-green-600"/>;
      case 'SEO': return <Search size={16} className="mr-3 text-purple-600"/>;
      case 'SOCIAL': return <Share2 size={16} className="mr-3 text-pink-600"/>;
      default: return <Bot size={16} className="mr-3 text-gray-500"/>;
    }
  };

  // AI Chat handler
  const handleAiChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const apiKey = settings?.geminiApiKey || '';
      if (!apiKey) {
        showMessage('error', 'Gemini API Key not configured. Go to API Configuration to set it.');
        setIsChatLoading(false);
        return;
      }

      const promptData = AGENT_PROMPTS[activeTab as AgentType] || AGENT_PROMPTS.MASTER;

      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: chatInput }] }],
          systemInstruction: { parts: [{ text: promptData.instruction }] }
        })
      });

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';

      setChatHistory(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: 'Error connecting to AI. Please check your API key.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Get article ideas from AI
  const handleGetArticleIdeas = async () => {
    if (!selectedResearchTopic || !selectedCategory) {
      showMessage('error', 'Please enter a topic and select a category.');
      return;
    }

    setEditorAiLoading(true);
    setShowSuggestions(false);

    try {
      const apiKey = settings?.geminiApiKey || '';
      if (!apiKey) {
        showMessage('error', 'Gemini API Key not configured. Go to API Configuration to set it.');
        setEditorAiLoading(false);
        return;
      }

      const categoryData = categories.find(c => c.id === selectedCategory);
      const context = settings.serviceArea || 'WNC';

      const query = `Based on the topic "${selectedResearchTopic}" for ${context} local news in the ${categoryData?.name || 'News'} category:

Generate 4 different article ideas. Each should have:
- A compelling headline (55-70 characters)
- A 2-sentence summary of what the article would cover
- The unique angle or hook

Return ONLY valid JSON array with no markdown:
[
  {"title": "...", "summary": "...", "angle": "..."},
  ...
]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      const data = await response.json();
      let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(jsonText);

      setArticleSuggestions(Array.isArray(suggestions) ? suggestions : []);
      setShowSuggestions(true);

      setChatHistory(prev => [
        ...prev,
        { role: 'user', text: `Get Article Ideas: ${selectedResearchTopic}` },
        { role: 'model', text: `Generated ${suggestions.length} article ideas. Select one below to create the full article.` }
      ]);
    } catch (err) {
      showMessage('error', 'Failed to generate ideas');
      setChatHistory(prev => [
        ...prev,
        { role: 'model', text: `Failed to generate ideas: ${(err as Error).message}` }
      ]);
    } finally {
      setEditorAiLoading(false);
    }
  };

  // Save agent article
  const handleSaveAgentArticle = async (showNotification = true) => {
    if (!agentArticle?.title) {
      showMessage('error', 'Please enter an article title');
      return;
    }

    try {
      const articleToSave: Article = {
        ...agentArticle,
        id: agentArticle.id || `art-${Date.now()}`,
        slug: agentArticle.slug || agentArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        publishedAt: agentArticle.publishedAt || new Date().toISOString(),
        createdAt: agentArticle.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: agentArticle.status || 'draft',
        category: agentArticle.category || 'News',
        featuredImage: agentArticle.featuredImage || agentArticle.imageUrl || '',
        imageUrl: agentArticle.imageUrl || agentArticle.featuredImage || '',
        excerpt: agentArticle.excerpt || (agentArticle.content ? agentArticle.content.substring(0, 150) + '...' : ''),
      };

      // Save to Firestore
      const articleRef = doc(db, 'articles', articleToSave.id);
      await setDoc(articleRef, articleToSave);

      // Update local state
      const existingIndex = articles.findIndex(a => a.id === articleToSave.id);
      if (existingIndex >= 0) {
        setArticles(prev => prev.map(a => a.id === articleToSave.id ? articleToSave : a));
      } else {
        setArticles(prev => [articleToSave, ...prev]);
      }

      if (showNotification) {
        showMessage('success', 'Article saved successfully');
        setChatHistory(prev => [...prev, { role: 'model', text: `✅ **Saved!** "${articleToSave.title}" has been saved as ${articleToSave.status}.` }]);
      }

      return articleToSave;
    } catch (err) {
      showMessage('error', 'Failed to save article');
      console.error(err);
    }
  };

  // Generate image for article using DALL-E
  const handleGenerateImageForArticle = async () => {
    if (!agentArticle?.title) {
      showMessage('error', 'Please enter an article title first');
      return;
    }

    setIsGeneratingImage(true);
    setChatHistory(prev => [...prev, { role: 'user', text: `🖼️ Generate image for: ${agentArticle.title}` }]);

    try {
      const apiKey = settings?.openaiApiKey;
      if (!apiKey) {
        showMessage('error', 'OpenAI API key not configured. Go to API Configuration.');
        setIsGeneratingImage(false);
        return;
      }

      const promptText = `${agentArticle.title}. ${agentArticle.excerpt || ''}. Professional news photo style, photorealistic.`;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: promptText.substring(0, 1000),
          n: 1,
          size: settings?.dalleSize || '1792x1024',
          quality: settings?.dalleQuality || 'standard',
          style: settings?.dalleStyle || 'natural'
        })
      });

      const data = await response.json();
      if (data.data?.[0]?.url) {
        setAgentArticle({ ...agentArticle, imageUrl: data.data[0].url, featuredImage: data.data[0].url });
        setChatHistory(prev => [...prev, { role: 'model', text: `🖼️ **Image Generated!** A professional featured image has been created for your article.` }]);
      } else {
        throw new Error(data.error?.message || 'Failed to generate image');
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: `❌ Image generation failed: ${(err as Error).message}` }]);
      showMessage('error', 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Submit article for review (Draft -> Review)
  const handleSubmitForReview = async () => {
    if (!selectedArticleForAction) return;

    const article = articles.find(a => a.id === selectedArticleForAction);
    if (!article) return;

    try {
      const updatedArticle = { ...article, status: 'review' as const, updatedAt: new Date().toISOString() };
      await updateDoc(doc(db, 'articles', article.id), { status: 'review', updatedAt: new Date().toISOString() });
      setArticles(prev => prev.map(a => a.id === article.id ? updatedArticle : a));
      setChatHistory(prev => [...prev, { role: 'model', text: `📨 **Submitted for Review!** "${article.title}" has been sent to the Editor.` }]);
      setSelectedArticleForAction('');
      showMessage('success', 'Article submitted for review');
    } catch (err) {
      showMessage('error', 'Failed to submit for review');
    }
  };

  // Editor review queue
  const handleReviewQueue = () => {
    const reviewArticles = articles.filter(a => a.status?.toLowerCase() === 'review');
    setChatHistory(prev => [...prev, {
      role: 'model',
      text: reviewArticles.length > 0
        ? `📋 **Review Queue** (${reviewArticles.length} articles):\n\n${reviewArticles.map((a, i) => `${i + 1}. "${a.title}" by ${a.author}`).join('\n')}`
        : `📋 **Review Queue is empty.** No articles are awaiting review.`
    }]);
  };

  // Check grammar / editorial review
  const handleCheckGrammar = async () => {
    if (!selectedArticleForAction) return;

    const article = articles.find(a => a.id === selectedArticleForAction);
    if (!article) return;

    setWorkflowAction('grammar');
    setChatHistory(prev => [...prev, { role: 'user', text: `📝 Run editorial review on: "${article.title}"` }]);

    try {
      const apiKey = settings?.geminiApiKey;
      if (!apiKey) {
        showMessage('error', 'Gemini API key not configured');
        setWorkflowAction(null);
        return;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `As a newspaper editor, review this article for grammar, clarity, and AP style. Provide brief feedback:\n\nTitle: ${article.title}\n\nContent: ${article.content?.substring(0, 2000)}` }] }]
        })
      });

      const data = await response.json();
      const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Review complete.';
      setChatHistory(prev => [...prev, { role: 'model', text: `📝 **Editorial Review Complete**\n\n${feedback}` }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: `❌ Review failed: ${(err as Error).message}` }]);
    } finally {
      setWorkflowAction(null);
    }
  };

  // Forward to chief / approve for publication (Review -> Published)
  const handleForwardToChief = async () => {
    if (!selectedArticleForAction) return;

    const article = articles.find(a => a.id === selectedArticleForAction);
    if (!article) return;

    try {
      const updatedArticle = { ...article, status: 'published' as const, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await updateDoc(doc(db, 'articles', article.id), { status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      setArticles(prev => prev.map(a => a.id === article.id ? updatedArticle : a));
      setChatHistory(prev => [...prev, { role: 'model', text: `✅ **Published!** "${article.title}" is now live on the website.` }]);
      setSelectedArticleForAction('');
      showMessage('success', 'Article published successfully');
    } catch (err) {
      showMessage('error', 'Failed to publish article');
    }
  };

  // Master agent tools
  const handleBroadcastDirective = () => {
    setChatHistory(prev => [...prev, {
      role: 'model',
      text: `📢 **Editorial Directive Broadcast**\n\nAs Editor-in-Chief, you can set directives for the newsroom:\n\n• Focus on local community stories\n• Prioritize breaking news coverage\n• Maintain AP style guidelines\n• Review all articles before publication\n\nType your directive and I'll help communicate it to the team.`
    }]);
  };

  const handleReviewCalendar = () => {
    const draftCount = articles.filter(a => a.status?.toLowerCase() === 'draft').length;
    const reviewCount = articles.filter(a => a.status?.toLowerCase() === 'review').length;
    const publishedCount = articles.filter(a => a.status?.toLowerCase() === 'published').length;

    setChatHistory(prev => [...prev, {
      role: 'model',
      text: `📅 **Editorial Calendar Overview**\n\n📝 Drafts: ${draftCount}\n👁️ In Review: ${reviewCount}\n✅ Published: ${publishedCount}\n\nTotal Pipeline: ${draftCount + reviewCount} articles in progress`
    }]);
  };

  const handleApprovePublication = () => {
    const reviewArticles = articles.filter(a => a.status?.toLowerCase() === 'review');
    setChatHistory(prev => [...prev, {
      role: 'model',
      text: reviewArticles.length > 0
        ? `✅ **Ready for Approval** (${reviewArticles.length} articles):\n\n${reviewArticles.map((a, i) => `${i + 1}. "${a.title}" by ${a.author}`).join('\n')}\n\nUse the Editor agent to review and publish these articles.`
        : `✅ **No articles pending approval.** All reviewed articles have been published.`
    }]);
  };

  // Create article from suggestion with animated status modal
  const handleCreateFromSuggestion = async (suggestion: { title: string; summary: string; angle: string }) => {
    setEditorAiLoading(true);
    setWorkflowAction('draft');
    setChatHistory(prev => [...prev, { role: 'user', text: `📝 Create full article: "${suggestion.title}"` }]);

    // Show status modal
    setShowStatusModal(true);
    setStatusModalIcon('🔍');
    setStatusModalMessage('Researching and gathering sources...');

    try {
      const apiKey = settings?.geminiApiKey;
      if (!apiKey) {
        showMessage('error', 'Gemini API key not configured');
        setShowStatusModal(false);
        return;
      }

      setChatHistory(prev => [...prev, { role: 'model', text: '🔍 **Researching and gathering sources...**' }]);

      // Simulate research phase
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatusModalIcon('📝');
      setStatusModalMessage('Compiling article structure...');

      const categoryData = categories.find(c => c.id === selectedCategory);
      const prompt = `Write a professional local news article with this information:

Title: ${suggestion.title}
Summary: ${suggestion.summary}
Angle: ${suggestion.angle}
Category: ${categoryData?.name || 'News'}
Location: ${settings.serviceArea || 'Western North Carolina'}

Write in AP style, 400-600 words. Include:
- Strong lede paragraph
- Supporting quotes (attributed to plausible local sources)
- Background context
- Forward-looking closing

Return ONLY the article body text, no title or metadata.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      // Update status to formatting
      setStatusModalIcon('✨');
      setStatusModalMessage('Formatting content and applying AP style...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Update status to image generation
      setStatusModalIcon('🖼️');
      setStatusModalMessage('Generating featured image...');

      // Try to generate image
      let imageUrl = '';
      if (settings?.openaiApiKey) {
        try {
          const imagePrompt = `${suggestion.title}. Professional news photo style, photorealistic, high quality journalism.`;
          const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.openaiApiKey}`
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: imagePrompt.substring(0, 1000),
              n: 1,
              size: settings?.dalleSize || '1792x1024',
              quality: settings?.dalleQuality || 'standard',
              style: settings?.dalleStyle || 'natural'
            })
          });
          const imageData = await imageResponse.json();
          imageUrl = imageData.data?.[0]?.url || '';
        } catch {
          // Image generation failed, continue without image
        }
      }

      // Final check status
      setStatusModalIcon('✅');
      setStatusModalMessage('Finalizing article...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const newArticle: Article = {
        id: `art-${Date.now()}`,
        title: suggestion.title,
        slug: suggestion.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content,
        excerpt: suggestion.summary,
        category: categoryData?.name || 'News',
        author: currentUser?.displayName || 'Staff Writer',
        status: 'draft',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageUrl,
        featuredImage: imageUrl,
        isFeatured: false,
        isBreakingNews: false,
      };

      setAgentArticle(newArticle);
      setAgentTab('settings');
      setShowSuggestions(false);
      setShowStatusModal(false);
      setChatHistory(prev => [...prev, { role: 'model', text: `✅ **Article Created!** "${suggestion.title}" is ready for editing.${imageUrl ? ' A featured image has been generated.' : ''} Review the content and save when ready.` }]);
    } catch (err) {
      setShowStatusModal(false);
      setChatHistory(prev => [...prev, { role: 'model', text: `❌ Failed to create article: ${(err as Error).message}` }]);
    } finally {
      setEditorAiLoading(false);
      setWorkflowAction(null);
    }
  };

  // Format AI response for display
  const formatAiResponse = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         article.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'all' ||
                           article.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      case 'date':
        comparison = new Date(a.publishedAt || a.createdAt || 0).getTime() - new Date(b.publishedAt || b.createdAt || 0).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Newsroom OS...</p>
        </div>
      </div>
    );
  }

  // Roles & Permissions handlers
  const handleTogglePermission = (role: UserRole, permKey: keyof UserPermissions) => {
    setCustomRolePermissions(prev => {
      const currentValue = prev[role][permKey];
      let newValue: boolean | 'all' | 'own' | 'none';

      if (typeof currentValue === 'boolean') {
        newValue = !currentValue;
      } else {
        // Cycle through: all -> own -> none -> all
        newValue = currentValue === 'all' ? 'own' : currentValue === 'own' ? 'none' : 'all';
      }

      return {
        ...prev,
        [role]: { ...prev[role], [permKey]: newValue }
      };
    });
  };

  const handleSaveRolePermissions = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), { ...settings, customRolePermissions }, { merge: true });
      showMessage('success', 'Role permissions saved successfully!');
    } catch (error) {
      console.error('Failed to save role permissions:', error);
      showMessage('error', 'Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleResetRolePermissions = () => {
    if (window.confirm('Reset all role permissions to default values?')) {
      setCustomRolePermissions(ROLE_PERMISSIONS);
      showMessage('success', 'Permissions reset to defaults');
    }
  };

  // Dashboard Content
  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your newsroom</p>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Zap size={16} className="text-blue-600" />
            Quick Actions
          </h2>
          <div className="flex gap-2 flex-1 justify-end flex-wrap">
            <button
              onClick={() => {
                setActiveTab('JOURNALIST');
                setAgentArticle({
                  id: '',
                  title: '',
                  content: '',
                  excerpt: '',
                  author: currentUser?.displayName || currentUser?.email || 'Staff Writer',
                  category: 'News',
                  status: 'draft',
                  featuredImage: '',
                  tags: [],
                  slug: ''
                });
                setChatHistory([]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:shadow-md transition-all duration-300 text-sm font-medium"
            >
              <Plus size={16} /> New Article
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 hover:shadow-md transition-all duration-300 text-sm font-medium"
            >
              <Eye size={16} /> Review Queue
              {stats.reviewArticles > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                  {stats.reviewArticles}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 hover:shadow-md transition-all duration-300 text-sm font-medium"
            >
              <Users size={16} /> Manage Users
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Articles Card */}
        <button
          onClick={() => setActiveTab('articles')}
          className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-blue-300 transition-all duration-300 text-left group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
              <FileText size={22} className="text-blue-600" />
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Articles</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalArticles}</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span>{stats.publishedArticles} published</span>
              <CheckCircle size={12} className="text-green-500" />
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>{stats.draftArticles} drafts</span>
              <PenTool size={12} className="text-blue-500" />
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>{stats.reviewArticles} in review</span>
              <Eye size={12} className="text-amber-500" />
            </div>
          </div>
        </button>

        {/* Users Card */}
        <button
          onClick={() => setActiveTab('users')}
          className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-purple-300 transition-all duration-300 text-left group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-300">
              <Users size={22} className="text-purple-600" />
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Users</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{users.length}</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span>{users.length} registered</span>
              <Activity size={12} className="text-green-500" />
            </div>
          </div>
        </button>

        {/* Views Card */}
        <button
          onClick={() => setActiveTab('articles')}
          className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-cyan-300 transition-all duration-300 text-left group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg group-hover:from-cyan-100 group-hover:to-cyan-200 transition-all duration-300">
              <TrendingUp size={22} className="text-cyan-600" />
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Total Views</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalViews.toLocaleString()}</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span>All time views</span>
              <BarChart3 size={12} className="text-cyan-500" />
            </div>
          </div>
        </button>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Articles by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(stats.categoryCounts).map(([category, count]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
              <p className="text-xs text-gray-500 capitalize truncate">{category}</p>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {articles.slice(0, 5).map((article, i) => (
            <div key={article.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${i === 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <FileText size={16} className={i === 0 ? 'text-blue-600' : 'text-gray-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                <p className="text-xs text-gray-500">{article.category} • {article.status}</p>
              </div>
              <span className="text-xs text-gray-400">
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Draft'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Articles Content
  const renderArticles = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-fit">
            <FileText size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Articles</h2>
          </div>
          <div className="relative flex-grow max-w-md">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {Object.keys(stats.categoryCounts).map(cat => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
          <div className="flex-grow"></div>
          <button
            onClick={() => {
              const newArticle: Article = {
                id: `art-${Date.now()}`,
                title: '',
                slug: '',
                excerpt: '',
                category: 'News',
                author: currentUser?.displayName || 'Staff Writer',
                publishedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageUrl: '',
                featuredImage: '',
                content: '',
                status: 'draft'
              };
              setAgentArticle(newArticle);
              setAgentTab('settings');
              setActiveTab('JOURNALIST');
              setChatHistory([]);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center shadow-sm transition-colors"
          >
            <Plus size={16} className="mr-2" /> New Article
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-auto bg-gray-50">
        <table className="w-full text-left text-sm bg-white">
          <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs sticky top-0 border-b">
            <tr>
              <th
                className="px-6 py-3 cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => {
                  if (sortField === 'title') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  else { setSortField('title'); setSortDirection('asc'); }
                }}
              >
                <span className="flex items-center gap-1">
                  Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              <th
                className="px-6 py-3 cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => {
                  if (sortField === 'category') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  else { setSortField('category'); setSortDirection('asc'); }
                }}
              >
                <span className="flex items-center gap-1">
                  Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              <th
                className="px-6 py-3 cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => {
                  if (sortField === 'status') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  else { setSortField('status'); setSortDirection('asc'); }
                }}
              >
                <span className="flex items-center gap-1">
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              <th
                className="px-6 py-3 cursor-pointer hover:bg-gray-200 select-none"
                onClick={() => {
                  if (sortField === 'date') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  else { setSortField('date'); setSortDirection('desc'); }
                }}
              >
                <span className="flex items-center gap-1">
                  Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredArticles.length > 0 ? filteredArticles.slice(0, 50).map(article => (
              <tr key={article.id} className="hover:bg-blue-50/50">
                <td className="px-6 py-4 font-medium">{article.title}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 capitalize">
                    {article.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    article.status?.toLowerCase() === 'published' ? 'bg-green-100 text-green-700' :
                    article.status?.toLowerCase() === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {article.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleTogglePublish(article)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title={article.status?.toLowerCase() === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      {article.status?.toLowerCase() === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setAgentArticle(article);
                        setAgentTab('settings');
                        setActiveTab('JOURNALIST');
                        setChatHistory([]);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Edit article"
                    >
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteArticle(article.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No articles found matching your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredArticles.length > 50 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
          Showing 50 of {filteredArticles.length} articles
        </div>
      )}
    </div>
  );

  // Users Content
  const renderUsers = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Users size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Users</h2>
          <div className="flex-grow"></div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center shadow-sm transition-colors">
            <UserPlus size={16} className="mr-2" /> Add User
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-auto bg-gray-50">
        <table className="w-full text-left text-sm bg-white">
          <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs sticky top-0 border-b">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length > 0 ? users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.displayName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700 capitalize">
                    {user.role || 'reader'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="px-3 py-1.5 rounded text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No users found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Settings Content
  const renderSettings = () => (
    <div className="space-y-6">
      {/* Visual Identity Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Palette size={20} className="text-blue-600" />
          Visual Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 flex items-center">
              <input
                type="checkbox"
                id="showTagline"
                checked={settings.showTagline !== false}
                onChange={(e) => setSettings({ ...settings, showTagline: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="showTagline" className="ml-2 text-sm text-gray-600">Show tagline in header</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Display Mode</label>
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setSettings({ ...settings, brandingMode: 'text' })}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${settings.brandingMode !== 'logo' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Text Logo
              </button>
              <button
                onClick={() => setSettings({ ...settings, brandingMode: 'logo' })}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${settings.brandingMode === 'logo' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Image Logo
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Logo (300x100px recommended)</label>
            <div className="flex items-start gap-3">
              {/* URL Input - Primary Method */}
              <input
                type="text"
                value={settings.logoUrl || ''}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value, brandingMode: 'logo' })}
                placeholder="Paste image URL here (e.g., from Imgur, Supabase, etc.)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {settings.logoUrl && (
                <>
                  <div className="w-[150px] h-[50px] border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, logoUrl: '', brandingMode: 'text' })}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Paste an image URL from any image hosting service (Imgur, Supabase, Google Drive, etc.).
              Best size: 300x100 pixels. After pasting, click &quot;Save All Settings&quot; below.
            </p>
          </div>
        </div>
      </div>

      {/* Editorial Settings Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Settings size={20} className="text-green-600" />
          Editorial Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Articles Per Page</label>
            <input
              type="number"
              value={settings.articlesPerPage}
              onChange={(e) => setSettings({ ...settings, articlesPerPage: parseInt(e.target.value) || 10 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Service Area (City/Region)</label>
            <input
              type="text"
              value={settings.serviceArea}
              onChange={(e) => setSettings({ ...settings, serviceArea: e.target.value })}
              placeholder="e.g. Asheville, Western North Carolina"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Target Audience</label>
            <input
              type="text"
              value={settings.targetAudience}
              onChange={(e) => setSettings({ ...settings, targetAudience: e.target.value })}
              placeholder="e.g. Locals, Tourists, Retirees"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Default Article Status</label>
            <select
              value={settings.defaultArticleStatus || 'draft'}
              onChange={(e) => setSettings({ ...settings, defaultArticleStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold transition-colors shadow-lg"
        >
          {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
          Save All Settings
        </button>
      </div>
    </div>
  );

  // API Configuration Content
  const renderApiConfig = () => (
    <div className="h-full overflow-y-auto pb-20">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">API Configuration</h2>
            <p className="text-gray-500">Configure third-party service integrations for your newspaper</p>
          </div>
          <div className="flex items-center text-sm text-green-600 font-bold">
            <CheckCircle size={16} className="mr-1"/> Settings Auto-Save
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setApiConfigTab('openai')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                apiConfigTab === 'openai'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span>OpenAI / DALL-E</span>
              </div>
            </button>

            <button
              onClick={() => setApiConfigTab('google')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                apiConfigTab === 'google'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span>Google AI / Gemini</span>
              </div>
            </button>

            <button
              onClick={() => setApiConfigTab('weather')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                apiConfigTab === 'weather'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cloud size={18} />
                <span>Weather API</span>
              </div>
            </button>

            <button
              onClick={() => setApiConfigTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                apiConfigTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign size={18} />
                <span>Payment Processors</span>
              </div>
            </button>
          </nav>
        </div>

        {/* OpenAI Tab */}
        {apiConfigTab === 'openai' && (
          <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Sparkles className="text-green-700" size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-lg mb-2">OpenAI API Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Powers AI image generation (DALL-E 3) and optional text features.
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    Get your API key here
                  </a>
                </p>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">OpenAI API Key *</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={settings.openaiApiKey || ''}
                  onChange={(e) => {
                    setSettings({ ...settings, openaiApiKey: e.target.value });
                    localStorage.setItem('openai_api_key', e.target.value);
                  }}
                  placeholder="sk-..."
                  className="flex-grow border border-gray-300 rounded p-3 font-mono text-sm"
                />
                <button
                  onClick={async () => {
                    if (!settings.openaiApiKey) {
                      showMessage('error', 'Please enter an API key first');
                      return;
                    }
                    try {
                      const response = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${settings.openaiApiKey}` }
                      });
                      if (response.ok) {
                        showMessage('success', '✓ API Key Valid! OpenAI services are ready.');
                      } else {
                        showMessage('error', '✗ API Key Invalid. Please check your key.');
                      }
                    } catch {
                      showMessage('error', '✗ API Key Test Failed');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 whitespace-nowrap"
                >
                  Test Key
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required for AI image generation. Your key is stored securely in browser localStorage.
              </p>
            </div>

            {/* DALL-E Settings */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <ImageIcon size={18} /> DALL-E 3 Image Generation Settings
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Default Image Quality</label>
                  <select
                    value={settings.dalleQuality || 'standard'}
                    onChange={(e) => setSettings({ ...settings, dalleQuality: e.target.value as 'standard' | 'hd' })}
                    className="w-full border border-gray-300 rounded p-2"
                  >
                    <option value="standard">Standard ($0.04 per image)</option>
                    <option value="hd">HD Quality ($0.08 per image)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Image Style</label>
                  <select
                    value={settings.dalleStyle || 'natural'}
                    onChange={(e) => setSettings({ ...settings, dalleStyle: e.target.value as 'natural' | 'vivid' })}
                    className="w-full border border-gray-300 rounded p-2"
                  >
                    <option value="natural">Natural (Realistic, photojournalism style)</option>
                    <option value="vivid">Vivid (Dramatic, eye-catching)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Default Image Size</label>
                  <select
                    value={settings.dalleSize || '1792x1024'}
                    onChange={(e) => setSettings({ ...settings, dalleSize: e.target.value as '1024x1024' | '1792x1024' | '1024x1792' })}
                    className="w-full border border-gray-300 rounded p-2"
                  >
                    <option value="1024x1024">Square (1024×1024)</option>
                    <option value="1792x1024">Landscape (1792×1024 - Recommended for articles)</option>
                    <option value="1024x1792">Portrait (1024×1792)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle size={18} /> Pricing & Usage
              </h4>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li><strong>DALL-E 3 Standard:</strong> $0.040 per image (1024×1024)</li>
                <li><strong>DALL-E 3 Standard:</strong> $0.080 per image (1024×1792 or 1792×1024)</li>
                <li><strong>DALL-E 3 HD:</strong> 2× the standard price</li>
                <li>Images are generated on-demand when requested</li>
                <li>Generated images are temporary URLs (valid for 1 hour)</li>
              </ul>
            </div>
          </section>
        )}

        {/* Google AI Tab */}
        {apiConfigTab === 'google' && (
          <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Sparkles className="text-blue-700" size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-lg mb-2">Google Generative AI (Gemini)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Powers the chat assistant, AI article generation, and content tools.
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    Get your API key here
                  </a>
                </p>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gemini API Key *</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={settings.geminiApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="AIza..."
                  className="flex-grow border border-gray-300 rounded p-3 font-mono text-sm"
                />
                <button
                  onClick={async () => {
                    if (!settings.geminiApiKey) {
                      showMessage('error', 'Please enter an API key first');
                      return;
                    }
                    try {
                      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${settings.geminiApiKey}`);
                      if (response.ok) {
                        showMessage('success', '✓ API Key Valid! Gemini AI services are ready.');
                      } else {
                        showMessage('error', '✗ API Key Invalid. Please check your key.');
                      }
                    } catch {
                      showMessage('error', '✗ API Key Test Failed');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 whitespace-nowrap"
                >
                  Test Key
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required for AI article writing, chat assistant, and content tools.
              </p>
            </div>

            {/* Status Indicator */}
            <div className={`border rounded p-4 text-sm ${settings.geminiApiKey ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className={settings.geminiApiKey ? 'text-green-800' : 'text-amber-800'}>
                <strong>Status:</strong>
                <code className="bg-white px-2 py-1 rounded text-xs ml-2">
                  {settings.geminiApiKey ? '✓ API Key Configured' : '✗ No API Key - AI features disabled'}
                </code>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Model</label>
              <select
                value={settings.geminiModel || 'gemini-2.5-flash'}
                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                className="w-full border border-gray-300 rounded p-2"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, cost-effective)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Balanced)</option>
                <option value="gemini-pro">Gemini Pro (Most capable)</option>
              </select>
            </div>

            {/* Free Tier Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-900 mb-2">Free Tier Limits</h4>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>15 requests per minute</li>
                <li>1,500 requests per day</li>
                <li>1 million tokens per day</li>
              </ul>
            </div>
          </section>
        )}

        {/* Weather Tab */}
        {apiConfigTab === 'weather' && (
          <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Cloud className="text-cyan-700" size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-lg mb-2">OpenWeatherMap API</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Provides real-time weather data for your location.
                  <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    Get your free API key here
                  </a>
                </p>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={settings.weatherApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, weatherApiKey: e.target.value })}
                  placeholder="Enter your OpenWeatherMap API key"
                  className="flex-grow border border-gray-300 rounded p-3 font-mono text-sm"
                />
                <button
                  onClick={async () => {
                    if (!settings.weatherApiKey) {
                      showMessage('error', 'Please enter an API key first');
                      return;
                    }
                    try {
                      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&units=imperial&appid=${settings.weatherApiKey}`);
                      if (response.ok) {
                        showMessage('success', '✓ API Key Valid! Weather widget will now work.');
                      } else {
                        showMessage('error', '✗ API Key Invalid. Please check your key.');
                      }
                    } catch {
                      showMessage('error', '✗ Connection failed. Check your API key.');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 whitespace-nowrap"
                >
                  Test Key
                </button>
              </div>
            </div>

            {/* Default Location */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Location</label>
              <input
                type="text"
                value={settings.defaultLocation || 'Asheville, NC'}
                onChange={(e) => setSettings({ ...settings, defaultLocation: e.target.value })}
                placeholder="City, State or Coordinates"
                className="w-full border border-gray-300 rounded p-2"
              />
              <p className="text-xs text-gray-500 mt-1">Fallback location when geolocation is unavailable.</p>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h4 className="font-bold text-cyan-900 mb-2">Free Tier</h4>
              <ul className="text-sm text-cyan-800 space-y-1 list-disc list-inside">
                <li>1,000 API calls per day</li>
                <li>60 calls per minute</li>
                <li>Perfect for local news sites</li>
              </ul>
            </div>
          </section>
        )}

        {/* Payments Tab */}
        {apiConfigTab === 'payments' && (
          <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="text-purple-700" size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-lg mb-2">Payment Processor Integration</h3>
                <p className="text-sm text-gray-600">
                  Configure Stripe, PayPal, or other payment systems for subscriptions and business listings.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center">
              <DollarSign className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500 text-sm mb-2">Payment integrations coming soon</p>
              <p className="text-xs text-gray-400">Stripe, PayPal, and other payment processors will be available in a future update.</p>
            </div>
          </section>
        )}

        {/* Global Help Section */}
        <section className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-2 text-purple-900 flex items-center">
            <Info size={20} className="mr-2"/> API Security Best Practices
          </h3>
          <ul className="text-sm text-purple-800 space-y-2 list-disc list-inside">
            <li><strong>Store Keys Securely:</strong> All API keys are saved securely to your database.</li>
            <li><strong>Use Environment Variables:</strong> For production deployments, configure API keys in your <code className="bg-white px-1 py-0.5 rounded">.env</code> file.</li>
            <li><strong>Monitor Usage:</strong> Check your API provider dashboards regularly to monitor usage and costs.</li>
            <li><strong>Rotate Keys:</strong> Periodically regenerate API keys for enhanced security.</li>
            <li><strong>Never Share:</strong> Keep your API keys confidential. Never commit them to version control.</li>
          </ul>
        </section>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 mt-8">
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold transition-colors shadow-lg"
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save API Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Roles & Permissions Content
  const renderRolesAndPermissions = () => {
    const roles = Object.keys(ROLE_PERMISSIONS) as UserRole[];
    const permissionKeys = Object.keys(PERMISSION_LABELS) as (keyof UserPermissions)[];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">Roles & Permissions</h2>
            <p className="text-gray-500">Configure what each user role can do in the system</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetRolePermissions}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              <RefreshCw size={16} /> Reset to Defaults
            </button>
            <button
              onClick={handleSaveRolePermissions}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roles.map(role => (
            <div key={role} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{ROLE_LABELS[role]}</h3>
                    <p className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                  <Shield className="text-blue-600" size={20} />
                </div>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {permissionKeys.map(permKey => {
                    const value = customRolePermissions[role][permKey];
                    const isEnabled = value === true || value === 'all';
                    const isPartial = value === 'own';

                    return (
                      <button
                        key={permKey}
                        onClick={() => handleTogglePermission(role, permKey)}
                        className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                          isEnabled
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : isPartial
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        <span className="truncate pr-2">{PERMISSION_LABELS[permKey]}</span>
                        {isEnabled ? (
                          <CheckCircle size={14} className="flex-shrink-0" />
                        ) : isPartial ? (
                          <span className="text-[10px]">OWN</span>
                        ) : (
                          <X size={14} className="flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-bold text-sm text-gray-700 mb-2">Legend</h4>
          <div className="flex gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 border border-green-200 rounded"></span>
              <span>Full Permission</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></span>
              <span>Own Content Only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></span>
              <span>No Permission</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // AI Agent Chat Content - Full Implementation with News Flow
  const renderAgentChat = () => {
    const agentKey = activeTab as AgentType;
    const agentData = AGENT_PROMPTS[agentKey];
    if (!agentData) return null;

    // If no article is being worked on, show the "Get Started" view
    if (!agentArticle) {
      return (
        <div className="h-full flex flex-col overflow-hidden">
          {/* Agent Header */}
          <div className="bg-white border-b border-slate-200 px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-xl">
                  {getAgentIcon(agentKey)}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">{agentData.label}</h1>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">{agentData.instruction}</p>
                </div>
              </div>
              <button
                onClick={() => setAgentArticle({
                  id: '',
                  title: '',
                  slug: '',
                  excerpt: '',
                  category: 'News',
                  author: currentUser?.displayName || 'Staff',
                  publishedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  imageUrl: '',
                  featuredImage: '',
                  content: '',
                  status: 'draft'
                })}
                className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
              >
                <Plus size={18} /> New Article
              </button>
            </div>
          </div>

          {/* Main Content: Chat + Tool Panels */}
          <div className="flex-grow flex gap-6 p-6 overflow-hidden">
            {/* Chat Panel */}
            <div className="flex-grow bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="flex-grow p-6 overflow-y-auto space-y-4">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 shadow-sm border border-slate-200'}`}>
                      {msg.role === 'user' ? (
                        <div className="leading-relaxed">{msg.text}</div>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: formatAiResponse(msg.text) }} className="prose prose-sm max-w-none" />
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-3">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiChat()}
                    placeholder="Type your message..."
                    className="flex-grow border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200"
                  />
                  <button
                    onClick={handleAiChat}
                    disabled={isChatLoading}
                    className="bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <MessageSquare size={18}/>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Agent-Specific Tools */}
            <div className="w-[420px] flex flex-col gap-4 overflow-y-auto pr-2">
              {/* MASTER Agent Tools */}
              {activeTab === 'MASTER' && (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Terminal size={18} className="text-slate-600" /> Editor-in-Chief Tools
                    </h3>
                    <div className="space-y-3">
                      <button onClick={handleBroadcastDirective} className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2">
                        <Sparkles size={16} /> Broadcast Directives
                      </button>
                      <button onClick={handleReviewCalendar} className="w-full py-3 bg-slate-100 text-slate-900 font-medium rounded-xl hover:bg-slate-200 transition-all duration-200">
                        Review Editorial Calendar
                      </button>
                      <button onClick={handleApprovePublication} className="w-full py-3 bg-slate-100 text-slate-900 font-medium rounded-xl hover:bg-slate-200 transition-all duration-200">
                        Approve for Publication
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Current Queue</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Articles in Review</span>
                        <span className="font-semibold text-slate-900">{articles.filter(a => a.status?.toLowerCase() === 'review').length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Ready to Publish</span>
                        <span className="font-semibold text-emerald-600">{articles.filter(a => a.status?.toLowerCase() === 'review').length}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* JOURNALIST Agent Tools */}
              {activeTab === 'JOURNALIST' && (
                <>
                  <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl shadow-md p-4 mb-4">
                    <button
                      onClick={() => {
                        const newArticle: Article = {
                          id: 'article-' + Date.now(),
                          title: '',
                          slug: '',
                          excerpt: '',
                          category: 'News',
                          author: currentUser?.displayName || 'Staff',
                          publishedAt: new Date().toISOString(),
                          createdAt: new Date().toISOString(),
                          imageUrl: '',
                          featuredImage: '',
                          content: '',
                          status: 'draft'
                        };
                        setAgentArticle(newArticle);
                        setAgentTab('settings');
                      }}
                      className="w-full py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Sparkles size={18} className="text-emerald-600" /> Create New Article
                    </button>
                    <p className="text-xs text-white mt-2 text-center opacity-90">Use AI to generate ideas or write manually</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <FileText size={16} className="text-slate-600" /> Submit Draft
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      {articles.filter(a => a.status?.toLowerCase() === 'draft').length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                          <FileText size={32} className="mx-auto text-slate-400 mb-3" />
                          <p className="text-sm text-slate-600 mb-2 font-medium">No Draft Articles</p>
                          <p className="text-xs text-slate-500">Create a draft using the button above.</p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                              Select Draft Article ({articles.filter(a => a.status?.toLowerCase() === 'draft').length} available)
                            </label>
                            <select
                              value={selectedArticleForAction}
                              onChange={e => setSelectedArticleForAction(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                            >
                              <option value="">Choose article...</option>
                              {articles.filter(a => a.status?.toLowerCase() === 'draft').map(article => (
                                <option key={article.id} value={article.id}>{article.title}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={handleSubmitForReview}
                            disabled={!selectedArticleForAction}
                            className="w-full py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowRight size={14} /> Submit for Review
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Your Pipeline</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">{articles.filter(a => a.status?.toLowerCase() === 'draft').length}</div>
                        <div className="text-xs text-slate-600 mt-1">Drafts</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-2xl font-bold text-amber-600">{articles.filter(a => a.status?.toLowerCase() === 'review').length}</div>
                        <div className="text-xs text-slate-600 mt-1">In Review</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* EDITOR Agent Tools */}
              {activeTab === 'EDITOR' && (
                <>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Eye size={16} className="text-slate-600" /> Quick Actions
                      </h3>
                    </div>
                    <div className="p-5 space-y-3">
                      <button onClick={handleReviewQueue} className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2">
                        <Eye size={14} /> View Review Queue
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <CheckCircle size={16} className="text-slate-600" /> Editorial Review
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      {articles.filter(a => a.status?.toLowerCase() === 'review').length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                          <Eye size={32} className="mx-auto text-slate-400 mb-3" />
                          <p className="text-sm text-slate-600 mb-2 font-medium">Review Queue Empty</p>
                          <p className="text-xs text-slate-500">No articles are currently awaiting review.</p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                              Select Article to Review ({articles.filter(a => a.status?.toLowerCase() === 'review').length} in queue)
                            </label>
                            <select
                              value={selectedArticleForAction}
                              onChange={e => setSelectedArticleForAction(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                            >
                              <option value="">Choose article...</option>
                              {articles.filter(a => a.status?.toLowerCase() === 'review').map(article => (
                                <option key={article.id} value={article.id}>
                                  {article.title} - by {article.author}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={handleCheckGrammar}
                            disabled={editorAiLoading || !selectedArticleForAction}
                            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {workflowAction === 'grammar' ? (
                              <><RefreshCw size={14} className="animate-spin" /> Reviewing...</>
                            ) : (
                              <><CheckCircle size={14} /> Run Editorial Review</>
                            )}
                          </button>
                          <button
                            onClick={handleForwardToChief}
                            disabled={!selectedArticleForAction}
                            className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowRight size={14} /> Approve & Publish
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Review Queue</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-2xl font-bold text-amber-600">{articles.filter(a => a.status?.toLowerCase() === 'review').length}</div>
                        <div className="text-xs text-slate-600 mt-1">Pending</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-2xl font-bold text-emerald-600">{articles.filter(a => a.status?.toLowerCase() === 'published').length}</div>
                        <div className="text-xs text-slate-600 mt-1">Published</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Article Editor View (when agentArticle exists)
    return (
      <div className="h-full flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shrink-0 min-h-[76px]">
          <div className="flex items-center gap-5 flex-grow min-w-0 mr-4">
            <div className="p-2.5 bg-slate-50 rounded-xl shrink-0">
              {getAgentIcon(activeTab)}
            </div>
            <input
              value={agentArticle.title || ''}
              onChange={e => setAgentArticle({...agentArticle, title: e.target.value})}
              placeholder="Untitled Article"
              className="text-xl font-semibold text-slate-900 placeholder-slate-400 bg-transparent border-none focus:outline-none flex-grow min-w-0"
            />
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={async () => {
                if (agentArticle.status === 'draft') {
                  const updatedArticle = {...agentArticle, status: 'review' as const};
                  setAgentArticle(updatedArticle);
                  await handleSaveAgentArticle(false);
                  setChatHistory(prev => [...prev, { role: 'model', text: `📨 **Sent to Editor!** "${agentArticle.title}" is now in Review status.` }]);
                  setAgentArticle(null);
                }
              }}
              className="px-5 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
            >
              <AlertCircle size={16} /> Send to Editor
            </button>
            <button
              onClick={() => handleSaveAgentArticle(true)}
              disabled={!agentArticle?.title}
              className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={17} /> Save
            </button>
            <button
              onClick={() => setAgentArticle(null)}
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <X size={20}/>
            </button>
          </div>
        </div>

        {/* News Flow Status Bar */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-center gap-2">
            {/* Draft Step */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                agentArticle.status === 'draft'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110'
                  : agentArticle.status === 'review' || agentArticle.status === 'published'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-300 text-slate-500'
              }`}>
                {agentArticle.status === 'review' || agentArticle.status === 'published' ? (
                  <CheckCircle size={16} />
                ) : (
                  <PenTool size={16} />
                )}
              </div>
              <span className={`text-sm font-semibold ${agentArticle.status === 'draft' ? 'text-blue-700' : 'text-slate-600'}`}>
                📝 Draft
              </span>
            </div>

            {/* Connector Line */}
            <div className={`h-0.5 w-16 transition-all duration-300 ${
              agentArticle.status === 'review' || agentArticle.status === 'published' ? 'bg-green-500' : 'bg-slate-300'
            }`}></div>

            {/* Review Step */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                agentArticle.status === 'review'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/50 scale-110'
                  : agentArticle.status === 'published'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-300 text-slate-500'
              }`}>
                {agentArticle.status === 'published' ? <CheckCircle size={16} /> : <Eye size={16} />}
              </div>
              <span className={`text-sm font-semibold ${agentArticle.status === 'review' ? 'text-amber-700' : 'text-slate-600'}`}>
                👁️ Review
              </span>
            </div>

            {/* Connector Line */}
            <div className={`h-0.5 w-16 transition-all duration-300 ${agentArticle.status === 'published' ? 'bg-green-500' : 'bg-slate-300'}`}></div>

            {/* Published Step */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                agentArticle.status === 'published'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/50 scale-110'
                  : 'bg-slate-300 text-slate-500'
              }`}>
                <CheckCircle size={16} />
              </div>
              <span className={`text-sm font-semibold ${agentArticle.status === 'published' ? 'text-green-700' : 'text-slate-600'}`}>
                ✅ Published
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-grow overflow-hidden bg-slate-50">
          {/* Left: Editor */}
          <div className="w-2/3 flex flex-col">
            <div className="flex-grow overflow-y-auto p-10">
              <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/60 p-10">
                {/* Featured Image */}
                <div className="mb-10">
                  <label className="block text-sm font-medium text-slate-600 mb-4">Featured Image</label>
                  {agentArticle.imageUrl ? (
                    <div className="relative group">
                      <img src={agentArticle.imageUrl} alt="Featured" className="w-full h-64 object-cover rounded-xl border border-slate-200" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button onClick={() => setAgentArticle({...agentArticle, imageUrl: '', featuredImage: ''})} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon size={48} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500">No image yet - use Media tab to add</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Editor */}
                <div className="border-t border-slate-100 pt-10">
                  <label className="block text-sm font-medium text-slate-600 mb-4">Article Content</label>
                  <textarea
                    value={agentArticle.content || ''}
                    onChange={e => setAgentArticle({...agentArticle, content: e.target.value})}
                    placeholder="Write your story here..."
                    rows={20}
                    className="w-full border border-slate-200 rounded-xl p-4 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sidebar with Tabs */}
          <div className="w-1/3 flex flex-col bg-white border-l border-slate-200">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button onClick={() => setAgentTab('settings')} className={`flex-1 py-4 text-sm font-medium transition-all duration-200 ${agentTab === 'settings' ? 'text-slate-900 bg-white border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <Settings size={17} className="inline mr-2" /> Settings
              </button>
              <button onClick={() => setAgentTab('content')} className={`flex-1 py-4 text-sm font-medium transition-all duration-200 ${agentTab === 'content' ? 'text-slate-900 bg-white border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <FileText size={17} className="inline mr-2" /> Content
              </button>
              <button onClick={() => setAgentTab('media')} className={`flex-1 py-4 text-sm font-medium transition-all duration-200 ${agentTab === 'media' ? 'text-slate-900 bg-white border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <ImageIcon size={17} className="inline mr-2" /> Media
              </button>
              <button onClick={() => setAgentTab('options')} className={`flex-1 py-4 text-sm font-medium transition-all duration-200 ${agentTab === 'options' ? 'text-slate-900 bg-white border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <Sliders size={17} className="inline mr-2" /> Options
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-8">
              {/* Settings Tab */}
              {agentTab === 'settings' && (
                <div className="space-y-6">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Category</label>
                      <select value={agentArticle.category || 'News'} onChange={e => setAgentArticle({...agentArticle, category: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white">
                        <option value="News">News</option>
                        <option value="Sports">Sports</option>
                        <option value="Business">Business</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Outdoors">Outdoors</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Workflow Status</label>
                      <select value={agentArticle.status || 'draft'} onChange={e => setAgentArticle({...agentArticle, status: e.target.value as 'draft' | 'review' | 'published'})} className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white">
                        <option value="draft">📝 Draft (Journalist)</option>
                        <option value="review">👁️ Review (Editor)</option>
                        <option value="published">✅ Published</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Author</label>
                      <input value={agentArticle.author || 'Staff'} onChange={e => setAgentArticle({...agentArticle, author: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white" />
                    </div>
                  </div>

                  {/* AI Article Generator */}
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" /> AI Article Generator
                    </h3>
                    <p className="text-xs text-slate-600 mb-4">AI researches topic & writes full article</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Topic *</label>
                        <input type="text" value={selectedResearchTopic} onChange={e => setSelectedResearchTopic(e.target.value)} placeholder="e.g., 'downtown construction project'" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white" onKeyDown={e => e.key === 'Enter' && handleGetArticleIdeas()} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Category *</label>
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                          <option value="">Select category...</option>
                          <option value="news">News</option>
                          <option value="sports">Sports</option>
                          <option value="business">Business</option>
                          <option value="entertainment">Entertainment</option>
                          <option value="lifestyle">Lifestyle</option>
                          <option value="outdoors">Outdoors</option>
                        </select>
                      </div>
                      <button onClick={handleGetArticleIdeas} disabled={editorAiLoading || !selectedResearchTopic || !selectedCategory} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                        {workflowAction === 'research' ? <><RefreshCw size={16} className="animate-spin" /> Generating Ideas...</> : <><Sparkles size={16} /> Get Article Ideas</>}
                      </button>
                    </div>
                  </div>

                  {/* Article Suggestions */}
                  {showSuggestions && articleSuggestions.length > 0 && (
                    <div className="bg-white rounded-xl border border-emerald-200 shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-5 py-4 border-b border-emerald-200">
                        <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                          <Sparkles size={16} className="text-emerald-600" /> Choose an Article
                        </h3>
                        <p className="text-xs text-emerald-700 mt-1">Click any idea to create the full article</p>
                      </div>
                      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {articleSuggestions.map((suggestion, idx) => (
                          <button key={idx} onClick={() => handleCreateFromSuggestion(suggestion)} disabled={editorAiLoading} className="w-full text-left p-4 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg hover:border-emerald-400 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                {idx + 1}
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors">{suggestion.title}</h4>
                                <p className="text-xs text-slate-600 mb-2 leading-relaxed">{suggestion.summary}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content Tab */}
              {agentTab === 'content' && (
                <div className="space-y-7">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Excerpt</label>
                    <textarea value={agentArticle.excerpt || ''} onChange={e => setAgentArticle({...agentArticle, excerpt: e.target.value})} placeholder="Brief summary of the article..." rows={3} className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Image Credit</label>
                    <input value={(agentArticle as Article & { imageCredit?: string }).imageCredit || ''} onChange={e => setAgentArticle({...agentArticle, imageCredit: e.target.value} as Article)} placeholder="Photo credit or source..." className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white text-sm" />
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {agentTab === 'media' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Featured Image</label>
                    {agentArticle.imageUrl ? (
                      <div className="relative group">
                        <img src={agentArticle.imageUrl} alt="Featured" className="w-full h-48 object-cover rounded-xl border-2 border-slate-200" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button onClick={() => setAgentArticle({...agentArticle, imageUrl: '', featuredImage: ''})} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                            Remove Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon size={48} className="mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">No image yet</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Image Generation */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-600" /> AI Image Generation
                    </h3>
                    <p className="text-xs text-slate-600 mb-4">Generate a professional featured image using DALL-E 3</p>
                    <button onClick={handleGenerateImageForArticle} disabled={isGeneratingImage || !agentArticle?.title} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      {isGeneratingImage ? <><RefreshCw size={14} className="animate-spin" /> Generating Image...</> : <><Sparkles size={14} /> Generate Featured Image</>}
                    </button>
                    {!agentArticle?.title && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> Please enter an article title first
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Or Use Image URL</label>
                    <input value={agentArticle.imageUrl || ''} onChange={e => setAgentArticle({...agentArticle, imageUrl: e.target.value, featuredImage: e.target.value})} placeholder="https://example.com/image.jpg" className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-sm font-mono" />
                  </div>
                </div>
              )}

              {/* Options Tab */}
              {agentTab === 'options' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Sliders size={18} className="text-slate-600" /> Article Options
                    </h3>
                    <p className="text-sm text-slate-600 mb-6">Configure special features for this article</p>
                  </div>

                  {/* Featured Article Toggle */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={agentArticle.isFeatured || false} onChange={e => setAgentArticle({...agentArticle, isFeatured: e.target.checked})} className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-2 focus:ring-amber-500" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 flex items-center gap-2">⭐ Featured Article</div>
                        <div className="text-xs text-slate-500 mt-0.5">Display in hero rotation on homepage</div>
                      </div>
                    </label>
                  </div>

                  {/* Breaking News Toggle */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={agentArticle.isBreakingNews || false} onChange={e => setAgentArticle({...agentArticle, isBreakingNews: e.target.checked})} className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-2 focus:ring-red-500" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 flex items-center gap-2">🚨 Breaking News</div>
                        <div className="text-xs text-slate-500 mt-0.5">Mark as breaking news (24-hour duration)</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Media Library Content
  const renderMedia = () => {
    const filteredMedia = media.filter(m =>
      m.filename.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      (m.altText && m.altText.toLowerCase().includes(mediaSearch.toLowerCase()))
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-500 mt-1">{media.length} files in library</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <FolderPlus size={16} className="mr-2"/> New Folder
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <Upload size={16} className="mr-2"/> Upload Media
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Folder size={16} className="text-gray-500" />
            <button
              onClick={() => setCurrentFolder('/')}
              className={`hover:text-blue-600 ${currentFolder === '/' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
            >
              Root
            </button>
            {currentFolder !== '/' && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-blue-600 font-semibold">{currentFolder.replace(/\//g, '')}</span>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMedia.map((item) => (
                <div key={item.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer">
                  <img
                    src={item.thumbnailData}
                    alt={item.altText || item.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button className="p-2 bg-white rounded-full shadow-lg">
                      <Eye size={16} className="text-gray-700" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-xs truncate">{item.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p>{media.length === 0 ? 'No media files yet. Upload your first image!' : 'No files match your search.'}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Categories Content
  const renderCategories = () => {
    const defaultCategories: CategoryData[] = [
      { id: 'cat-news', name: 'News', slug: 'news', count: 0, color: '#1d4ed8' },
      { id: 'cat-sports', name: 'Sports', slug: 'sports', count: 0, color: '#dc2626' },
      { id: 'cat-business', name: 'Business', slug: 'business', count: 0, color: '#059669' },
      { id: 'cat-entertainment', name: 'Entertainment', slug: 'entertainment', count: 0, color: '#7c3aed' },
      { id: 'cat-lifestyle', name: 'Lifestyle', slug: 'lifestyle', count: 0, color: '#db2777' },
      { id: 'cat-outdoors', name: 'Outdoors', slug: 'outdoors', count: 0, color: '#16a34a' },
    ];

    const displayCategories = categories.length > 0 ? categories : defaultCategories;

    // Count articles per category
    const getCategoryCount = (slug: string) => {
      return articles.filter(a => a.category?.toLowerCase() === slug.toLowerCase()).length;
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-500 mt-1">Manage article categories and their settings</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <Plus size={16} className="mr-2"/> Add Category
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Slug</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Articles</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Color</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm font-mono">{cat.slug}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-bold">{getCategoryCount(cat.slug)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-xs font-mono text-gray-500">{cat.color}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Infrastructure Content
  const renderInfrastructure = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database size={20} className="text-blue-600" />
          Data Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportData}
            className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 transition-all"
          >
            <Download size={24} className="text-blue-600" />
            <div className="text-left">
              <p className="font-semibold">Export Backup</p>
              <p className="text-sm text-gray-500">Download all data as JSON</p>
            </div>
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-green-400 transition-all"
          >
            <RefreshCw size={24} className="text-green-600" />
            <div className="text-left">
              <p className="font-semibold">Sync from Firebase</p>
              <p className="text-sm text-gray-500">Refresh all data from cloud</p>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          System Status
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Firebase Connection</span>
            <span className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle size={16} /> Connected
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Total Articles</span>
            <span className="font-bold">{stats.totalArticles}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Database</span>
            <span className="text-sm text-gray-500 font-mono">gwnct (Firestore)</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Newsroom OS Version</span>
            <span className="text-sm font-mono bg-gray-200 px-2 py-0.5 rounded">v{NEWSROOM_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col font-sans text-gray-900">
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Global Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          {settings.brandingMode === 'logo' && settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.siteName || 'Site Logo'}
              className="max-h-10 w-auto object-contain"
            />
          ) : (
            <span className="font-serif font-bold text-xl text-gray-800">{settings.siteName || 'WNC Times'}</span>
          )}
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-mono">Newsroom OS v{NEWSROOM_VERSION}</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('settings')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors" title="Settings">
            <Settings size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="Help">
            <HelpCircle size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors relative" title="Notifications">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-blue-500 hover:text-blue-700 transition-colors" title="Messages">
            <MessageCircle size={20} />
          </button>
          <Link href="/" target="_blank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors" title="Open Frontend">
            <ExternalLink size={20} />
          </Link>

          <div className="w-px h-8 bg-gray-200 mx-2"></div>

          {/* Avatar with Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold text-sm border-2 border-gray-200">
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-900">{currentUser?.displayName || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
                <button onClick={() => setActiveTab('settings')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Settings size={16} /> Account Settings
                </button>
                <div className="border-t border-gray-100 my-2"></div>
                <button
                  onClick={() => { setShowProfileMenu(false); signOut(); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          {/* Dashboard Link */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard size={16} className="mr-3" /> Admin Dashboard
            </button>
          </div>

          {/* AI Workforce Section - TOP */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => toggleMenuSection('ai')}
              className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={12} className="text-purple-500" />
                AI Workforce
              </span>
              <ChevronDown size={14} className={`transform transition-transform ${menuSections.ai ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {menuSections.ai && (
              <nav className="space-y-1">
                <button onClick={() => { setActiveTab('MASTER'); setChatHistory([]); }} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'MASTER' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <ShieldAlert size={16} className="mr-3 text-indigo-600" /> Editor-in-Chief
                </button>
                <button onClick={() => { setActiveTab('JOURNALIST'); setChatHistory([]); }} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'JOURNALIST' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <PenTool size={16} className="mr-3 text-blue-600" /> Journalist
                </button>
                <button onClick={() => { setActiveTab('EDITOR'); setChatHistory([]); }} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'EDITOR' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <CheckCircle size={16} className="mr-3 text-green-600" /> Editor
                </button>
                <button onClick={() => { setActiveTab('SEO'); setChatHistory([]); }} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'SEO' ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Search size={16} className="mr-3 text-purple-600" /> SEO Specialist
                </button>
                <button onClick={() => { setActiveTab('SOCIAL'); setChatHistory([]); }} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'SOCIAL' ? 'bg-pink-50 text-pink-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Share2 size={16} className="mr-3 text-pink-600" /> Social Media
                </button>
              </nav>
            )}
          </div>

          {/* Content Section - SECOND */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => toggleMenuSection('content')}
              className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
            >
              <span>Content</span>
              <ChevronDown size={14} className={`transform transition-transform ${menuSections.content ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {menuSections.content && (
              <nav className="space-y-1">
                <button onClick={() => setActiveTab('articles')} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'articles' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <FileText size={16} className="mr-3" /> Articles
                </button>
                <button onClick={() => setActiveTab('categories')} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'categories' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <ListOrdered size={16} className="mr-3" /> Categories
                </button>
                <button onClick={() => setActiveTab('media')} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'media' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <ImageIcon size={16} className="mr-3" /> Media
                </button>
                <button className="w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium text-gray-400 cursor-not-allowed">
                  <MessageSquare size={16} className="mr-3" /> Comments
                </button>
              </nav>
            )}
          </div>

          {/* Components Section - THIRD */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => toggleMenuSection('components')}
              className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
            >
              <span>Components</span>
              <ChevronDown size={14} className={`transform transition-transform ${menuSections.components ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {menuSections.components && (
              <nav className="space-y-1">
                <button className="w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium text-gray-400 cursor-not-allowed">
                  <Database size={16} className="mr-3" /> Business Directory
                </button>
                <button className="w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium text-gray-400 cursor-not-allowed">
                  <DollarSign size={16} className="mr-3" /> Advertising
                </button>
                <button className="w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium text-gray-400 cursor-not-allowed">
                  <FileText size={16} className="mr-3" /> Blog
                </button>
                <button className="w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium text-gray-400 cursor-not-allowed">
                  <Users size={16} className="mr-3" /> Community
                </button>
              </nav>
            )}
          </div>

          {/* Users Section */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => toggleMenuSection('users')}
              className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
            >
              <span>Users</span>
              <ChevronDown size={14} className={`transform transition-transform ${menuSections.users ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {menuSections.users && (
              <nav className="space-y-1">
                <button onClick={() => setActiveTab('users')} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Users size={16} className="mr-3" /> All Users
                </button>
                <button onClick={() => setActiveTab('roles')} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'roles' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Shield size={16} className="mr-3" /> Roles & Permissions
                </button>
                <button className="w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium text-gray-400 cursor-not-allowed">
                  <UserPlus size={16} className="mr-3" /> Add New User
                </button>
              </nav>
            )}
          </div>

          {/* System Settings Section */}
          <div className="p-4">
            <button
              onClick={() => toggleMenuSection('systemSettings')}
              className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
            >
              <span>System Settings</span>
              <ChevronDown size={14} className={`transform transition-transform ${menuSections.systemSettings ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {menuSections.systemSettings && (
              <nav className="space-y-1">
                <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Settings size={16} className="mr-3" /> Site Settings
                </button>
                <button onClick={() => setActiveTab('api-config')} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'api-config' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Plug size={16} className="mr-3" /> API Configuration
                </button>
                <button onClick={() => setActiveTab('infrastructure')} className={`w-full text-left px-3 py-2 rounded flex items-center text-sm font-medium ${activeTab === 'infrastructure' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Server size={16} className="mr-3" /> Infrastructure
                </button>
              </nav>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow bg-gray-100 overflow-y-auto">
          <div className="max-w-[1800px] mx-auto px-6 py-6">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'articles' && renderArticles()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'infrastructure' && renderInfrastructure()}
            {activeTab === 'categories' && renderCategories()}
            {activeTab === 'media' && renderMedia()}
            {activeTab === 'api-config' && renderApiConfig()}
            {activeTab === 'roles' && renderRolesAndPermissions()}
            {isAgentView(activeTab) && renderAgentChat()}
          </div>
        </main>

        {/* Status Modal for AI Generation Progress */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
              <div className="text-6xl mb-4 animate-pulse">
                {statusModalIcon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Creating Article
              </h3>
              <p className="text-slate-600 mb-4">
                {statusModalMessage}
              </p>
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
