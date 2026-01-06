'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Article } from '@/types/article';
import {
  LayoutDashboard, FileText, Settings, Users, Database, User,
  Plus, Trash2, Edit, Save, X, RefreshCw, CheckCircle, LogOut,
  Search, Image as ImageIcon, Eye, EyeOff, Bell, HelpCircle,
  Download, Cloud, Palette, ExternalLink, MessageCircle, Activity,
  ChevronDown, BarChart3, Clock, TrendingUp, Zap, PenTool,
  MessageSquare, UserPlus, ListOrdered, Server, Plug, Shield,
  Sparkles, DollarSign, AlertCircle, Info, Bot, ShieldAlert, Share2,
  Send, Lightbulb, Folder, FolderPlus, Upload, Sliders, Terminal, ArrowRight, Volume2,
  CheckSquare, Square, MinusSquare, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Mail, UserCheck, UserX, Filter, Phone, Calendar, ChevronsLeft, ChevronsRight, AlertTriangle, Building2,
  UserCog, MoreHorizontal
} from 'lucide-react';
import { AGENT_PROMPTS, AgentType } from '@/data/prompts';
import { ROLE_PERMISSIONS, ROLE_LABELS, ROLE_DESCRIPTIONS, PERMISSION_LABELS, UserRole, UserPermissions } from '@/data/rolePermissions';
import { storageService } from '@/lib/storage';
import { batchFormatArticles, batchMigrateImages, formatArticleContent, batchAssignArticlesToUser, getArticleBySlug } from '@/lib/articles';
import { AddUserModal } from '@/components/admin/modals/AddUserModal';
import { EditUserModal } from '@/components/admin/modals/EditUserModal';
import { createUser, updateUser, getUsers, deleteUser, seedTestUsers, deleteTestUsers } from '@/lib/users';
import { getAllAIJournalists } from '@/lib/aiJournalists';
import { AIJournalist } from '@/types/aiJournalist';
import { MediaFile } from '@/types/media';
import dynamic from 'next/dynamic';

// Dynamically import AIJournalistManager to avoid SSR issues
const AIJournalistManager = dynamic(() => import('@/components/admin/AIJournalistManager'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import CategoryManager to avoid SSR issues
const CategoryManager = dynamic(() => import('@/components/admin/CategoryManager'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-slate-200 rounded-xl p-4 min-h-[400px] bg-slate-50 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    </div>
  ),
});

// Dynamically import DirectoryAdmin
const DirectoryAdmin = dynamic(() => import('@/components/admin/DirectoryAdmin'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import BlogAdmin
const BlogAdmin = dynamic(() => import('@/components/admin/BlogAdmin'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import EventsAdmin
const EventsAdmin = dynamic(() => import('@/components/admin/EventsAdmin'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import AdvertisingAdmin
const AdvertisingAdmin = dynamic(() => import('@/components/admin/AdvertisingAdmin'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import ArticlesAdmin
const ArticlesAdmin = dynamic(() => import('@/components/admin/ArticlesAdmin'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import MediaManager
const MediaManager = dynamic(() => import('@/components/admin/MediaManager'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import MediaPickerModal
const MediaPickerModal = dynamic(() => import('@/components/admin/MediaPickerModal'), {
  ssr: false,
});

// shadcn/ui components
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster, toast } from 'sonner';

type TabType = 'dashboard' | 'articles' | 'categories' | 'media' | 'users' | 'roles' | 'settings' | 'api-config' | 'infrastructure' | 'MASTER' | 'JOURNALIST' | 'EDITOR' | 'SEO' | 'SOCIAL' | 'directory' | 'advertising' | 'blog' | 'events' | 'modules' | 'ai-journalists' | 'my-account';

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
  // Chat Assistant Settings
  chatSystemPrompt?: string;
  chatWelcomeMessage?: string;
  ttsVoice?: string;
  // ElevenLabs Settings
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  elevenLabsModel?: 'eleven_turbo_v2' | 'eleven_monolingual_v1' | 'eleven_multilingual_v2';
  elevenLabsStability?: number;
  elevenLabsSimilarity?: number;
  elevenLabsStyle?: number;
  elevenLabsSpeakerBoost?: boolean;
  elevenLabsStreaming?: boolean;
  ttsProvider?: 'google' | 'elevenlabs';
}

interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  accountType: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'blocked';
  photoURL?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: string;
}

interface MenuSections {
  ai: boolean;
  content: boolean;
  components: boolean;
  modules: boolean;
  plugins: boolean;
  users: boolean;
  systemSettings: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// MediaFile interface moved to @/types/media.ts

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
  const { currentUser, userProfile, signOut, isImpersonating, realUserProfile, impersonateUser, stopImpersonation } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Initialize from URL param if present
    const tabParam = searchParams.get('tab');
    if (tabParam && ['dashboard', 'articles', 'categories', 'media', 'users', 'roles', 'settings', 'api-config', 'infrastructure', 'MASTER', 'JOURNALIST', 'EDITOR', 'SEO', 'SOCIAL', 'directory', 'advertising', 'blog', 'events', 'modules', 'ai-journalists', 'my-account'].includes(tabParam)) {
      return tabParam as TabType;
    }
    return 'dashboard';
  });

  // Sync activeTab to URL (skip if action param is present - those handlers manage their own URL)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action) return; // Don't interfere with action handlers

    const currentTab = searchParams.get('tab');
    if (activeTab !== currentTab) {
      const params = new URLSearchParams(searchParams.toString());
      if (activeTab === 'dashboard') {
        params.delete('tab');
      } else {
        params.set('tab', activeTab);
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [activeTab, searchParams, router, pathname]);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [aiJournalists, setAiJournalists] = useState<AIJournalist[]>([]);
  const [addingUser, setAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  // Enhanced User Management State
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'all'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [userAccountFilter, setUserAccountFilter] = useState<'all' | 'free' | 'basic' | 'premium' | 'enterprise'>('all');
  const [userSortField, setUserSortField] = useState<'displayName' | 'email' | 'role' | 'status' | 'createdAt'>('createdAt');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('desc');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
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
    components: false,
    modules: false,
    plugins: false,
    users: true,
    systemSettings: true,
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // AI Agent states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Categories and Media states - initialize with defaults since they're not loaded from Firestore yet
  const [categories, setCategories] = useState<CategoryData[]>([
    { id: 'cat-news', name: 'News', slug: 'news', count: 0, color: '#2563eb' },
    { id: 'cat-sports', name: 'Sports', slug: 'sports', count: 0, color: '#dc2626' },
    { id: 'cat-business', name: 'Business', slug: 'business', count: 0, color: '#059669' },
    { id: 'cat-entertainment', name: 'Entertainment', slug: 'entertainment', count: 0, color: '#7c3aed' },
    { id: 'cat-lifestyle', name: 'Lifestyle', slug: 'lifestyle', count: 0, color: '#db2777' },
    { id: 'cat-outdoors', name: 'Outdoors', slug: 'outdoors', count: 0, color: '#16a34a' },
  ]);
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

  // Author selection states
  const [authorOptions, setAuthorOptions] = useState<Array<{id: string, displayName: string, photoURL: string, role: string}>>([]);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const AUTHOR_ROLES = ['admin', 'business-owner', 'editor-in-chief', 'editor', 'content-contributor'];

  // Maintenance states
  const [migratingImages, setMigratingImages] = useState(false);
  const [sanitizingArticles, setSanitizingArticles] = useState(false);
  const [assigningArticles, setAssigningArticles] = useState(false);
  const [maintenanceProgress, setMaintenanceProgress] = useState({ current: 0, total: 0, message: '' });
  const [selectedArticleForAction, setSelectedArticleForAction] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Agent Article Editor states
  const [agentArticle, setAgentArticle] = useState<Article | null>(null);
  const [agentTab, setAgentTab] = useState<'settings' | 'content' | 'media' | 'options'>('settings');
  const articleLoadingRef = useRef<string | null>(null); // Track which article is being loaded
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Status Modal for AI generation progress
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalMessage, setStatusModalMessage] = useState('');
  const [statusModalIcon, setStatusModalIcon] = useState('🔍');

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // API Configuration state
  const [apiConfigTab, setApiConfigTab] = useState<'openai' | 'google' | 'elevenlabs' | 'weather' | 'payments'>('openai');

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

  // Populate author options when users load
  useEffect(() => {
    if (users.length > 0) {
      const authors = users
        .filter(u => AUTHOR_ROLES.includes(u.role))
        .map(u => ({
          id: u.id,
          displayName: u.displayName || u.email || 'Unknown',
          photoURL: u.photoURL || '',
          role: u.role,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
      setAuthorOptions(authors);

      // Auto-select current user if no author set in agentArticle
      if (agentArticle && !agentArticle.author && currentUser) {
        const currentAuthor = authors.find(a => a.id === currentUser.uid);
        if (currentAuthor) {
          setAgentArticle({
            ...agentArticle,
            author: currentAuthor.displayName,
            authorId: currentAuthor.id,
            authorPhotoURL: currentAuthor.photoURL,
          });
        } else if (userProfile) {
          // Current user not in authors list, use their profile
          setAgentArticle({
            ...agentArticle,
            author: userProfile.displayName || currentUser.displayName || currentUser.email || 'Staff',
            authorId: currentUser.uid,
            authorPhotoURL: userProfile.photoURL || currentUser.photoURL || '',
          });
        }
      }
    }
  }, [users, currentUser, userProfile]);

  // Handle URL action params (e.g., ?action=new-article, ?action=edit-article&id=xxx)
  useEffect(() => {
    const action = searchParams.get('action');
    console.log('[Admin] Action handler effect running, action:', action);

    if (action === 'new-article' && currentUser) {
      // Create new article and open JOURNALIST tab
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
      // Clear the action from URL to prevent re-triggering
      window.history.replaceState({}, '', '/admin');
    } else if (action === 'edit-article') {
      // Load existing article and open JOURNALIST tab
      const articleId = searchParams.get('id');
      console.log('[Admin] Edit article requested, id:', articleId);

      if (articleId) {
        // Check if we're already loading this article (prevent race condition)
        if (articleLoadingRef.current === articleId) {
          console.log('[Admin] Already loading article, skipping duplicate request');
          return;
        }

        // Mark that we're loading this article
        articleLoadingRef.current = articleId;
        console.log('[Admin] Starting article load for:', articleId);

        // Set tab state immediately
        setActiveTab('JOURNALIST');
        setAgentTab('settings');

        // Fetch the article
        getArticleBySlug(articleId).then((article) => {
          console.log('[Admin] getArticleBySlug returned:', article ? `Article: ${article.title}` : 'null');

          if (article) {
            console.log('[Admin] Setting agentArticle state with:', {
              id: article.id,
              title: article.title,
              status: article.status,
              category: article.category
            });
            setAgentArticle(article);
            setChatHistory([]);
          } else {
            console.error('[Admin] Article not found:', articleId);
            alert(`Article not found: ${articleId}`);
          }
          // Clear the action from URL to prevent re-triggering
          window.history.replaceState({}, '', '/admin?tab=JOURNALIST');
          // Clear the loading ref
          articleLoadingRef.current = null;
        }).catch((error) => {
          console.error('[Admin] Error loading article:', error);
          window.history.replaceState({}, '', '/admin');
          articleLoadingRef.current = null;
        });
      }
    }
  }, [searchParams, currentUser]);

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

      // Load AI Journalists
      try {
        const journalists = await getAllAIJournalists(true); // Only active ones
        setAiJournalists(journalists);
      } catch (err) {
        console.error('Failed to load AI journalists:', err);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      toast.success(text);
    } else {
      toast.error(text);
    }
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

  // Migrate all article images to Firebase Storage
  const handleMigrateImages = async () => {
    if (migratingImages) return;
    setMigratingImages(true);
    setMaintenanceProgress({ current: 0, total: 0, message: 'Starting image migration...' });

    try {
      const result = await batchMigrateImages((current, total, message) => {
        setMaintenanceProgress({ current, total, message });
      });

      if (result.migrated > 0) {
        toast.success(`Migrated ${result.migrated} images to Firebase Storage`);
        loadData(); // Refresh articles
      } else if (result.failed > 0) {
        toast.error(`Migration completed with ${result.failed} failures`);
      } else {
        toast.info('All images already migrated');
      }

      if (result.errors.length > 0) {
        console.error('Migration errors:', result.errors);
      }
    } catch (error) {
      console.error('Image migration failed:', error);
      toast.error('Image migration failed');
    } finally {
      setMigratingImages(false);
      setMaintenanceProgress({ current: 0, total: 0, message: '' });
    }
  };

  // Sanitize all article content and excerpts
  const handleSanitizeArticles = async () => {
    if (sanitizingArticles) return;
    setSanitizingArticles(true);
    setMaintenanceProgress({ current: 0, total: 0, message: 'Starting content sanitization...' });

    try {
      const result = await batchFormatArticles((current, total, message) => {
        setMaintenanceProgress({ current, total, message });
      });

      if (result.updated > 0) {
        toast.success(`Sanitized ${result.updated} articles`);
        loadData(); // Refresh articles
      } else {
        toast.info('All articles already clean');
      }

      if (result.errors.length > 0) {
        console.error('Sanitization errors:', result.errors);
      }
    } catch (error) {
      console.error('Article sanitization failed:', error);
      toast.error('Article sanitization failed');
    } finally {
      setSanitizingArticles(false);
      setMaintenanceProgress({ current: 0, total: 0, message: '' });
    }
  };

  // Assign all articles to a specific user
  const handleAssignArticlesToUser = async () => {
    const userName = window.prompt(
      'Enter the display name of the user to assign all articles to:',
      'Marge'
    );

    if (!userName) return;

    // Optional: allow direct photoURL input
    const directPhotoURL = window.prompt(
      'Enter photo URL (or leave empty to use profile photo):',
      ''
    );

    if (!window.confirm(
      `This will assign ALL articles to "${userName}".\n\n` +
      (directPhotoURL ? `Photo URL provided: Yes\n\n` : 'Will use photo from user profile.\n\n') +
      'Continue?'
    )) {
      return;
    }

    setAssigningArticles(true);
    setMaintenanceProgress({ current: 0, total: 0, message: 'Starting assignment...' });

    try {
      const result = await batchAssignArticlesToUser(userName, (current, total, message) => {
        setMaintenanceProgress({ current, total, message });
      }, directPhotoURL || undefined);

      if (result.updated > 0) {
        toast.success(`Assigned ${result.updated} articles to ${userName}`);
        loadData(); // Refresh articles
      } else if (result.errors.length > 0) {
        toast.error(result.errors[0]);
      }

      if (result.errors.length > 0) {
        console.error('Assignment errors:', result.errors);
      }
    } catch (error) {
      console.error('Article assignment failed:', error);
      toast.error('Article assignment failed');
    } finally {
      setAssigningArticles(false);
      setMaintenanceProgress({ current: 0, total: 0, message: '' });
    }
  };

  const toggleMenuSection = (section: keyof MenuSections) => {
    // Accordion behavior: close all sections except the one being toggled
    setMenuSections(prev => {
      const isCurrentlyOpen = prev[section];
      // If opening a section, close all others
      if (!isCurrentlyOpen) {
        return {
          ai: section === 'ai',
          content: section === 'content',
          components: section === 'components',
          modules: section === 'modules',
          plugins: section === 'plugins',
          users: section === 'users',
          systemSettings: section === 'systemSettings',
        };
      }
      // If closing, just toggle it
      return { ...prev, [section]: false };
    });
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
    if (!selectedResearchTopic || !agentArticle?.category) {
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

      // Use article's category directly
      const categoryName = agentArticle?.category || 'News';
      const context = settings.serviceArea || 'WNC';

      const query = `Based on the topic "${selectedResearchTopic}" for ${context} local news in the ${categoryName} category:

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
  const handleSaveAgentArticle = async (showNotification = true, articleOverride?: Article) => {
    // Use the override article if provided, otherwise use agentArticle state
    const articleData = articleOverride || agentArticle;

    if (!articleData?.title) {
      showMessage('error', 'Please enter an article title');
      return;
    }

    try {
      // Format content to proper HTML paragraphs before saving
      const formattedContent = formatArticleContent(articleData.content || '');

      const articleToSave: Article = {
        ...articleData,
        id: articleData.id || `art-${Date.now()}`,
        slug: articleData.slug || articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        publishedAt: articleData.publishedAt || new Date().toISOString(),
        createdAt: articleData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: articleData.status || 'draft',
        category: articleData.category || 'News',
        featuredImage: articleData.featuredImage || articleData.imageUrl || '',
        imageUrl: articleData.imageUrl || articleData.featuredImage || '',
        content: formattedContent,
        excerpt: articleData.excerpt || (formattedContent ? formattedContent.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : ''),
        authorId: currentUser?.uid || articleData.authorId,
        authorPhotoURL: currentUser?.photoURL || articleData.authorPhotoURL,
        // Set breaking news timestamp when isBreakingNews is true
        breakingNewsTimestamp: articleData.isBreakingNews ? new Date().toISOString() : undefined,
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
        const tempUrl = data.data[0].url;
        setChatHistory(prev => [...prev, { role: 'model', text: `🖼️ **Image Generated!** Saving to permanent storage...` }]);

        // Persist the image to Firebase Storage before it expires
        const permanentUrl = await storageService.uploadAssetFromUrl(tempUrl);

        setAgentArticle({ ...agentArticle, imageUrl: permanentUrl, featuredImage: permanentUrl });
        setChatHistory(prev => [...prev, { role: 'model', text: `✅ **Image Saved!** Your featured image has been permanently stored.` }]);
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

      // Use article's category directly
      const categoryName = agentArticle?.category || 'News';
      const prompt = `Write a professional local news article with this information:

Title: ${suggestion.title}
Summary: ${suggestion.summary}
Angle: ${suggestion.angle}
Category: ${categoryName}
Location: ${settings.serviceArea || 'Western North Carolina'}

Write in AP style, 400-600 words. Include:
- Strong lede paragraph
- Supporting quotes (attributed to plausible local sources)
- Background context
- Forward-looking closing

CRITICAL FORMATTING REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. Each paragraph MUST be wrapped in its own <p></p> tags
2. Use <h2></h2> for section subheadings
3. Use <blockquote></blockquote> for direct quotes
4. Use <strong></strong> for emphasis on key terms
5. NEVER put the entire article in a single <p> tag - break it into multiple paragraphs
6. Each new thought or topic should be a separate <p> paragraph
7. Do NOT include the article title
8. Do NOT use markdown formatting
9. Return ONLY valid HTML tags, nothing else

Example structure:
<p>First paragraph with the lede...</p>
<h2>Section heading</h2>
<p>Next paragraph...</p>
<blockquote>"Quote from source," said Name, title.</blockquote>
<p>More content...</p>`;

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
      let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Clean up AI response - remove markdown code blocks if present
      content = content
        .replace(/^```html\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // If content doesn't have HTML tags, wrap paragraphs
      if (!content.includes('<p>') && !content.includes('<h')) {
        content = content
          .split(/\n\n+/)
          .filter((p: string) => p.trim())
          .map((p: string) => `<p>${p.trim()}</p>`)
          .join('\n');
      }

      // CRITICAL FIX: If content is one giant paragraph, split it intelligently
      // Check if there's essentially one <p> tag with tons of content
      const pTagCount = (content.match(/<p[^>]*>/gi) || []).length;
      const contentLength = content.replace(/<[^>]+>/g, '').length;

      if (pTagCount <= 1 && contentLength > 500) {
        // Extract the text, split by sentences that end paragraphs, re-wrap
        let text = content.replace(/<\/?p[^>]*>/gi, '').trim();

        // Split on sentence endings that typically mark paragraph breaks
        // (after quotes, after certain phrases, every 2-3 sentences)
        const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [text];
        const paragraphs: string[] = [];
        let currentParagraph = '';
        let sentenceCount = 0;

        for (const sentence of sentences) {
          currentParagraph += sentence;
          sentenceCount++;

          // Start new paragraph after: quotes end, or every 3-4 sentences
          const isQuoteEnd = sentence.includes('" ') || sentence.includes('." ') || sentence.includes('," ');
          const isLongEnough = sentenceCount >= 3 && currentParagraph.length > 200;

          if (isQuoteEnd || isLongEnough || sentenceCount >= 4) {
            paragraphs.push(currentParagraph.trim());
            currentParagraph = '';
            sentenceCount = 0;
          }
        }

        // Don't forget the last paragraph
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
        }

        // Rebuild with proper paragraph tags
        if (paragraphs.length > 1) {
          content = paragraphs.map(p => `<p>${p}</p>`).join('\n');
        }
      }

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
          const tempImageUrl = imageData.data?.[0]?.url || '';

          // Persist image to Firebase Storage before it expires
          if (tempImageUrl) {
            setStatusModalMessage('Saving image to permanent storage...');
            imageUrl = await storageService.uploadAssetFromUrl(tempImageUrl);
          }
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
        category: categoryName,
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

  // Roles that can access the admin panel
  const ADMIN_ROLES = ['admin', 'business-owner', 'editor-in-chief', 'editor', 'content-contributor'];
  const hasAdminAccess = userProfile?.role && ADMIN_ROLES.includes(userProfile.role);

  // Access denied for non-admin roles (respects impersonation)
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Impersonation Banner - so admin can stop impersonating */}
        {isImpersonating && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog size={18} />
              <span className="font-medium">
                Viewing as: {userProfile?.displayName || userProfile?.email}
              </span>
              <Badge variant="secondary" className="bg-amber-600 text-white">
                {userProfile?.role?.replace('-', ' ')}
              </Badge>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={stopImpersonation}
              className="bg-white text-amber-600 hover:bg-amber-50"
            >
              Stop Impersonating
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center min-h-[calc(100vh-48px)]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription>
                {isImpersonating
                  ? `The "${userProfile?.role?.replace('-', ' ')}" role does not have access to the admin panel.`
                  : "You don't have permission to access the admin panel."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {isImpersonating
                  ? "Click 'Stop Impersonating' above to return to your admin account."
                  : "Please contact an administrator if you believe this is an error."
                }
              </p>
              {!isImpersonating && (
                <Button asChild>
                  <Link href="/">Return to Homepage</Link>
                </Button>
              )}
            </CardContent>
          </Card>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your newsroom</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleExportData}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap size={16} className="text-primary" />
              Quick Actions
            </div>
            <div className="flex gap-2 flex-1 justify-end flex-wrap">
              <Button
                variant="secondary"
                size="sm"
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
              >
                <Plus size={16} className="mr-2" />
                New Article
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatusFilter('review');
                  setActiveTab('articles');
                }}
              >
                <Eye size={16} className="mr-2" />
                Review Queue
                {stats.reviewArticles > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.reviewArticles}
                  </Badge>
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('users')}
              >
                <Users size={16} className="mr-2" />
                Manage Users
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all" onClick={() => setActiveTab('articles')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Articles</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalArticles}</div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stats.publishedArticles} published</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Live</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stats.draftArticles} drafts</span>
                <Badge variant="outline">Draft</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stats.reviewArticles} in review</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">Review</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all" onClick={() => setActiveTab('users')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {users.length} registered users
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all" onClick={() => setActiveTab('articles')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <TrendingUp className="h-5 w-5 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 size={14} />
                All time pageviews
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Articles by Category</CardTitle>
            <CardDescription>Distribution of content across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(stats.categoryCounts).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest articles in your newsroom</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {articles.slice(0, 5).map((article, i) => (
                <div key={article.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className={`p-2 rounded-lg ${i === 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                    <FileText size={16} className={i === 0 ? 'text-primary' : 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{article.title}</p>
                    <p className="text-xs text-muted-foreground">{article.category}</p>
                  </div>
                  <Badge variant={article.status === 'published' ? 'default' : 'outline'} className="shrink-0">
                    {article.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Maintenance Tools
          </CardTitle>
          <CardDescription>Database cleanup and migration utilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Migration */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <ImageIcon size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Migrate Images</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Move all article images from temporary URLs (Supabase, DALL-E, etc.) to Firebase Storage for permanent hosting.
                  </p>
                  {migratingImages && maintenanceProgress.message && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin" />
                        {maintenanceProgress.message}
                      </div>
                      {maintenanceProgress.total > 0 && (
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${(maintenanceProgress.current / maintenanceProgress.total) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={handleMigrateImages}
                    disabled={migratingImages || sanitizingArticles}
                  >
                    {migratingImages ? (
                      <>
                        <RefreshCw size={14} className="mr-2 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="mr-2" />
                        Migrate Images
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Sanitization */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Sparkles size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Sanitize Content</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clean up article HTML, remove empty tags, fix formatting issues, and regenerate clean excerpts.
                  </p>
                  {sanitizingArticles && maintenanceProgress.message && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin" />
                        {maintenanceProgress.message}
                      </div>
                      {maintenanceProgress.total > 0 && (
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${(maintenanceProgress.current / maintenanceProgress.total) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={handleSanitizeArticles}
                    disabled={migratingImages || sanitizingArticles}
                  >
                    {sanitizingArticles ? (
                      <>
                        <RefreshCw size={14} className="mr-2 animate-spin" />
                        Sanitizing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="mr-2" />
                        Sanitize Articles
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Articles Content
  const renderArticles = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">Manage your news content</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAssignArticlesToUser}
            disabled={assigningArticles}
          >
            <UserCheck size={16} className="mr-2" />
            {assigningArticles ? 'Assigning...' : 'Assign Author'}
          </Button>
          <Button
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
          >
            <Plus size={16} className="mr-2" />
            New Article
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter" className="text-sm text-muted-foreground whitespace-nowrap">Status:</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="category-filter" className="text-sm text-muted-foreground whitespace-nowrap">Category:</Label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All</option>
                {Object.keys(stats.categoryCounts).map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex-1" />
            <p className="text-sm text-muted-foreground">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  if (sortField === 'title') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  else { setSortField('title'); setSortDirection('asc'); }
                }}
              >
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  if (sortField === 'category') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  else { setSortField('category'); setSortDirection('asc'); }
                }}
              >
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  if (sortField === 'status') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  else { setSortField('status'); setSortDirection('asc'); }
                }}
              >
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  if (sortField === 'date') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  else { setSortField('date'); setSortDirection('desc'); }
                }}
              >
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length > 0 ? filteredArticles.slice(0, 50).map(article => (
              <TableRow key={article.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell
                  className="font-medium max-w-[300px] truncate text-primary hover:underline cursor-pointer"
                  onClick={() => {
                    setAgentArticle(article);
                    setAgentTab('settings');
                    setActiveTab('JOURNALIST');
                    setChatHistory([]);
                  }}
                >
                  {article.title}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{article.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={article.status?.toLowerCase() === 'published' ? 'default' : 'outline'}
                    className={
                      article.status?.toLowerCase() === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                      article.status?.toLowerCase() === 'draft' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                      article.status?.toLowerCase() === 'review' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                      ''
                    }
                  >
                    {article.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePublish(article)}
                      title={article.status?.toLowerCase() === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      {article.status?.toLowerCase() === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAgentArticle(article);
                        setAgentTab('settings');
                        setActiveTab('JOURNALIST');
                        setChatHistory([]);
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteArticle(article.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>No articles found matching your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {filteredArticles.length > 50 && (
          <div className="p-4 border-t text-center text-sm text-muted-foreground">
            Showing 50 of {filteredArticles.length} articles
          </div>
        )}
      </Card>
    </div>
  );

  // Enhanced Users Content
  const renderUsers = () => {
    const ROLES: UserRole[] = ['admin', 'business-owner', 'editor-in-chief', 'editor', 'content-contributor', 'commenter', 'reader', 'guest'];
    const ACCOUNT_TYPES = ['free', 'basic', 'premium', 'enterprise'] as const;

    const ROLE_COLORS: Record<UserRole, string> = {
      'admin': 'bg-red-100 text-red-800',
      'business-owner': 'bg-purple-100 text-purple-800',
      'editor-in-chief': 'bg-blue-100 text-blue-800',
      'editor': 'bg-cyan-100 text-cyan-800',
      'content-contributor': 'bg-green-100 text-green-800',
      'commenter': 'bg-yellow-100 text-yellow-800',
      'reader': 'bg-gray-100 text-gray-800',
      'guest': 'bg-slate-100 text-slate-800',
    };

    const ACCOUNT_TYPE_COLORS: Record<string, string> = {
      'free': 'bg-gray-100 text-gray-700',
      'basic': 'bg-blue-100 text-blue-700',
      'premium': 'bg-amber-100 text-amber-700',
      'enterprise': 'bg-purple-100 text-purple-700',
    };

    // Filter and sort users
    let filteredUsers = [...users];

    // Search filter
    if (userSearchTerm) {
      const term = userSearchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(term) ||
          (user.displayName?.toLowerCase().includes(term) ?? false) ||
          (user.phone?.includes(term) ?? false)
      );
    }

    // Role filter
    if (userRoleFilter !== 'all') {
      filteredUsers = filteredUsers.filter((user) => user.role === userRoleFilter);
    }

    // Status filter
    if (userStatusFilter !== 'all') {
      filteredUsers = filteredUsers.filter((user) => user.status === userStatusFilter);
    }

    // Account type filter
    if (userAccountFilter !== 'all') {
      filteredUsers = filteredUsers.filter((user) => user.accountType === userAccountFilter);
    }

    // Sort
    filteredUsers.sort((a, b) => {
      let aVal: string | number | Date;
      let bVal: string | number | Date;

      switch (userSortField) {
        case 'displayName':
          aVal = a.displayName?.toLowerCase() || '';
          bVal = b.displayName?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'role':
          aVal = ROLES.indexOf(a.role);
          bVal = ROLES.indexOf(b.role);
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return userSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return userSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / userPageSize);
    const startIndex = (userCurrentPage - 1) * userPageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + userPageSize);

    // Selection helpers
    const allCurrentPageSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.has(u.id));
    const someCurrentPageSelected = paginatedUsers.some(u => selectedUsers.has(u.id));

    const toggleSelectUser = (userId: string, index: number, shiftKey: boolean) => {
      const newSelected = new Set(selectedUsers);

      if (shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          if (paginatedUsers[i]) {
            newSelected.add(paginatedUsers[i].id);
          }
        }
      } else {
        if (newSelected.has(userId)) {
          newSelected.delete(userId);
        } else {
          newSelected.add(userId);
        }
      }

      setSelectedUsers(newSelected);
      setLastSelectedIndex(index);
    };

    const toggleSelectAll = () => {
      const newSelected = new Set(selectedUsers);
      if (allCurrentPageSelected) {
        paginatedUsers.forEach(u => newSelected.delete(u.id));
      } else {
        paginatedUsers.forEach(u => newSelected.add(u.id));
      }
      setSelectedUsers(newSelected);
    };

    const selectAllFiltered = () => {
      const newSelected = new Set(selectedUsers);
      filteredUsers.forEach(u => newSelected.add(u.id));
      setSelectedUsers(newSelected);
    };

    const clearSelection = () => setSelectedUsers(new Set());

    // Bulk actions
    const handleBulkRoleChange = async (newRole: UserRole) => {
      for (const userId of selectedUsers) {
        await updateUser(userId, { role: newRole });
      }
      const newUsers = await getUsers();
      setUsers(newUsers);
      clearSelection();
      toast.success(`Updated role for ${selectedUsers.size} users`);
    };

    const handleBulkStatusChange = async (newStatus: 'active' | 'blocked') => {
      for (const userId of selectedUsers) {
        await updateUser(userId, { status: newStatus });
      }
      const newUsers = await getUsers();
      setUsers(newUsers);
      clearSelection();
      toast.success(`Updated status for ${selectedUsers.size} users`);
    };

    const handleBulkAccountChange = async (newType: 'free' | 'basic' | 'premium' | 'enterprise') => {
      for (const userId of selectedUsers) {
        await updateUser(userId, { accountType: newType });
      }
      const newUsers = await getUsers();
      setUsers(newUsers);
      clearSelection();
      toast.success(`Updated account type for ${selectedUsers.size} users`);
    };

    const handleBulkDelete = async () => {
      for (const userId of selectedUsers) {
        await deleteUser(userId);
      }
      const newUsers = await getUsers();
      setUsers(newUsers);
      clearSelection();
      setShowDeleteConfirm(false);
      toast.success(`Deleted ${selectedUsers.size} users`);
    };

    const handleExport = (format: 'csv' | 'json') => {
      const dataToExport = selectedUsers.size > 0
        ? filteredUsers.filter(u => selectedUsers.has(u.id))
        : filteredUsers;

      if (format === 'csv') {
        const headers = ['ID', 'Email', 'Name', 'Role', 'Account Type', 'Status', 'Created'];
        const rows = dataToExport.map(u => [
          u.id,
          u.email,
          u.displayName || '',
          u.role,
          u.accountType,
          u.status,
          new Date(u.createdAt).toISOString()
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
      toast.success(`Exported ${dataToExport.length} users`);
    };

    const handleSort = (field: typeof userSortField) => {
      if (userSortField === field) {
        setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setUserSortField(field);
        setUserSortDirection('asc');
      }
    };

    const SortableHeader = ({ field, label }: { field: typeof userSortField; label: string }) => (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {label}
        {userSortField === field ? (
          userSortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
        ) : (
          <ArrowUp size={14} className="opacity-30" />
        )}
      </button>
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              {users.length} total users • Showing {startIndex + 1}-{Math.min(startIndex + userPageSize, filteredUsers.length)} of {filteredUsers.length} filtered
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setAddingUser(true)}>
              <UserPlus size={16} className="mr-2" />
              Add User
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                toast.info('Creating test users with Firebase Auth...');
                try {
                  const res = await fetch('/api/users/seed-test', { method: 'POST' });
                  const result = await res.json();
                  if (result.created?.length > 0) {
                    toast.success(`Created ${result.created.length} test users (password: test123)`);
                  }
                  if (result.skipped?.length > 0) {
                    toast.info(`Skipped ${result.skipped.length} existing users`);
                  }
                  if (result.errors?.length > 0) {
                    toast.error(`Errors: ${result.errors.join(', ')}`);
                  }
                  const newUsers = await getUsers();
                  setUsers(newUsers);
                } catch (error) {
                  toast.error('Failed to seed test users');
                  console.error(error);
                }
              }}
              title="Create test users for each role (password: test123)"
            >
              <Zap size={16} className="mr-2" />
              Seed Test Users
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download size={16} />
            </Button>
            <Button variant="outline" onClick={async () => {
              const newUsers = await getUsers();
              setUsers(newUsers);
              toast.success('Users refreshed');
            }}>
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedUsers.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="text-blue-600" size={20} />
                <span className="font-medium text-blue-900">{selectedUsers.size} selected</span>
                <button onClick={selectAllFiltered} className="text-sm text-blue-600 hover:text-blue-800 underline">
                  Select all {filteredUsers.length}
                </button>
                <span className="text-gray-400">|</span>
                <button onClick={clearSelection} className="text-sm text-gray-600 hover:text-gray-800">
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {/* Role Dropdown */}
                <select
                  onChange={(e) => e.target.value && handleBulkRoleChange(e.target.value as UserRole)}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>Change Role</option>
                  {ROLES.map(role => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
                {/* Status Dropdown */}
                <select
                  onChange={(e) => e.target.value && handleBulkStatusChange(e.target.value as 'active' | 'blocked')}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>Change Status</option>
                  <option value="active">Activate</option>
                  <option value="blocked">Block</option>
                </select>
                {/* Account Type Dropdown */}
                <select
                  onChange={(e) => e.target.value && handleBulkAccountChange(e.target.value as any)}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>Change Plan</option>
                  {ACCOUNT_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={userSearchTerm}
                  onChange={(e) => { setUserSearchTerm(e.target.value); setUserCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
              {/* Role Filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value as any); setUserCurrentPage(1); }}
                className="px-3 py-2 border rounded-lg bg-background"
              >
                <option value="all">All Roles</option>
                {ROLES.map(role => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
              {/* Status Filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => { setUserStatusFilter(e.target.value as any); setUserCurrentPage(1); }}
                className="px-3 py-2 border rounded-lg bg-background"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              {/* Account Type Filter */}
              <select
                value={userAccountFilter}
                onChange={(e) => { setUserAccountFilter(e.target.value as any); setUserCurrentPage(1); }}
                className="px-3 py-2 border rounded-lg bg-background"
              >
                <option value="all">All Plans</option>
                {ACCOUNT_TYPES.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <button onClick={toggleSelectAll} className="p-1">
                    {allCurrentPageSelected ? (
                      <CheckSquare size={18} className="text-blue-600" />
                    ) : someCurrentPageSelected ? (
                      <MinusSquare size={18} className="text-blue-600" />
                    ) : (
                      <Square size={18} className="text-gray-400" />
                    )}
                  </button>
                </TableHead>
                <TableHead><SortableHeader field="displayName" label="User" /></TableHead>
                <TableHead><SortableHeader field="role" label="Role" /></TableHead>
                <TableHead><SortableHeader field="status" label="Status" /></TableHead>
                <TableHead>Plan</TableHead>
                <TableHead><SortableHeader field="createdAt" label="Joined" /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? paginatedUsers.map((user, index) => {
                const isSelected = selectedUsers.has(user.id);
                return (
                  <TableRow
                    key={user.id}
                    className={`cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => setViewingUser(user)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleSelectUser(user.id, index, e.shiftKey)}
                        className="p-1"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} className="text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold ${user.photoURL ? 'hidden' : ''}`}>
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{user.displayName || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[user.role]}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={ACCOUNT_TYPE_COLORS[user.accountType || 'free']}>
                        {(user.accountType || 'free').charAt(0).toUpperCase() + (user.accountType || 'free').slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit size={14} className="mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await impersonateUser(user.id);
                                toast.success(`Now viewing as ${user.displayName || user.email}`);
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to impersonate user');
                              }
                            }}
                          >
                            <UserCog size={14} className="mr-2" /> Impersonate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users size={48} className="mb-4 opacity-20" />
                      <p>No users found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <select
                  value={userPageSize}
                  onChange={(e) => { setUserPageSize(Number(e.target.value)); setUserCurrentPage(1); }}
                  className="px-2 py-1 border rounded text-sm"
                >
                  {[10, 25, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserCurrentPage(1)}
                  disabled={userCurrentPage === 1}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserCurrentPage(p => Math.max(1, p - 1))}
                  disabled={userCurrentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm px-2">
                  Page {userCurrentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={userCurrentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserCurrentPage(totalPages)}
                  disabled={userCurrentPage === totalPages}
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* User Detail Drawer */}
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setViewingUser(null)} />
            <div className="relative w-full max-w-md bg-background shadow-2xl h-full overflow-y-auto">
              {/* Drawer Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <button
                  onClick={() => setViewingUser(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex flex-col items-center pt-4">
                  {viewingUser.photoURL ? (
                    <img src={viewingUser.photoURL} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-white/30" />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/30">
                      {viewingUser.displayName?.charAt(0) || viewingUser.email?.charAt(0) || '?'}
                    </div>
                  )}
                  <h2 className="text-xl font-bold mt-4">{viewingUser.displayName || 'No Name'}</h2>
                  <p className="text-blue-100">{viewingUser.email}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge className={`${ROLE_COLORS[viewingUser.role]} bg-white/90`}>
                      {ROLE_LABELS[viewingUser.role]}
                    </Badge>
                    <Badge className={viewingUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {viewingUser.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Drawer Actions */}
              <div className="p-4 border-b flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingUser(viewingUser); setViewingUser(null); }}>
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={async () => {
                    const newStatus = viewingUser.status === 'active' ? 'blocked' : 'active';
                    await updateUser(viewingUser.id, { status: newStatus });
                    const newUsers = await getUsers();
                    setUsers(newUsers);
                    setViewingUser({ ...viewingUser, status: newStatus });
                    toast.success(`User ${newStatus === 'active' ? 'activated' : 'blocked'}`);
                  }}
                >
                  {viewingUser.status === 'active' ? <UserX size={14} className="mr-1" /> : <UserCheck size={14} className="mr-1" />}
                  {viewingUser.status === 'active' ? 'Block' : 'Activate'}
                </Button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Details</h3>
                  <div className="space-y-3">
                    {viewingUser.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="text-muted-foreground" size={16} />
                        <span>{viewingUser.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="text-muted-foreground" size={16} />
                      <span>Joined {new Date(viewingUser.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="text-muted-foreground" size={16} />
                      <span>{ROLE_LABELS[viewingUser.role]}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Activity className="text-muted-foreground" size={16} />
                      <Badge className={ACCOUNT_TYPE_COLORS[viewingUser.accountType || 'free']}>
                        {(viewingUser.accountType || 'free').charAt(0).toUpperCase() + (viewingUser.accountType || 'free').slice(1)} Plan
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Activity Log */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Activity Log</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="p-1.5 bg-muted rounded-lg"><UserCheck size={14} className="text-muted-foreground" /></div>
                      <div>
                        <p>Logged in</p>
                        <p className="text-muted-foreground text-xs">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="p-1.5 bg-muted rounded-lg"><Edit size={14} className="text-muted-foreground" /></div>
                      <div>
                        <p>Updated profile</p>
                        <p className="text-muted-foreground text-xs">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="p-1.5 bg-muted rounded-lg"><UserPlus size={14} className="text-muted-foreground" /></div>
                      <div>
                        <p>Account created</p>
                        <p className="text-muted-foreground text-xs">{new Date(viewingUser.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
            <Card className="relative max-w-md mx-4">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <CardTitle>Delete Users</CardTitle>
                    <CardDescription>Are you sure you want to delete {selectedUsers.size} user(s)?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This action cannot be undone. All user data will be permanently removed.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleBulkDelete}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add User Modal */}
        {addingUser && (
          <AddUserModal
            onClose={() => setAddingUser(false)}
            onUserCreated={async () => {
              const newUsers = await getUsers();
              setUsers(newUsers);
              toast.success('User created successfully');
            }}
            currentUserRole="admin"
          />
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={async (userId, updates) => {
              await updateUser(userId, updates);
              const newUsers = await getUsers();
              setUsers(newUsers);
              toast.success('User updated successfully');
            }}
            currentUserRole="admin"
          />
        )}
      </div>
    );
  };

  // Settings Content
  const renderSettings = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground">Configure your publication&apos;s appearance and behavior</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
          Save Settings
        </Button>
      </div>

      {/* Visual Identity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={20} className="text-primary" />
            Visual Identity
          </CardTitle>
          <CardDescription>Configure how your publication appears to readers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-12 h-9 border rounded cursor-pointer"
                />
                <Input
                  id="primaryColor"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="showTagline"
                  checked={settings.showTagline !== false}
                  onChange={(e) => setSettings({ ...settings, showTagline: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <Label htmlFor="showTagline" className="text-sm font-normal text-muted-foreground">
                  Show tagline in header
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Mode</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={settings.brandingMode !== 'logo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSettings({ ...settings, brandingMode: 'text' })}
                >
                  Text Logo
                </Button>
                <Button
                  type="button"
                  variant={settings.brandingMode === 'logo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSettings({ ...settings, brandingMode: 'logo' })}
                >
                  Image Logo
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo (300x100px recommended)</Label>
            <div className="flex items-start gap-3">
              <Input
                id="logoUrl"
                value={settings.logoUrl || ''}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value, brandingMode: 'logo' })}
                placeholder="Paste image URL or upload below"
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingLogo(true);
                      try {
                        const url = await storageService.uploadLogo(file);
                        setSettings({ ...settings, logoUrl: url, brandingMode: 'logo' });
                        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
                      } catch (err) {
                        setMessage({ type: 'error', text: 'Failed to upload logo' });
                      } finally {
                        setUploadingLogo(false);
                      }
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploadingLogo} asChild>
                  <span>{uploadingLogo ? 'Uploading...' : 'Upload'}</span>
                </Button>
              </label>
              {settings.logoUrl && (
                <>
                  <div className="w-[150px] h-[50px] border rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings({ ...settings, logoUrl: '', brandingMode: 'text' })}
                    className="text-destructive"
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload an image or paste a URL. Best size: 300x100 pixels.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Editorial Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} className="text-green-600" />
            Editorial Settings
          </CardTitle>
          <CardDescription>Configure content and publishing preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="articlesPerPage">Articles Per Page</Label>
              <Input
                id="articlesPerPage"
                type="number"
                value={settings.articlesPerPage}
                onChange={(e) => setSettings({ ...settings, articlesPerPage: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceArea">Service Area</Label>
              <Input
                id="serviceArea"
                value={settings.serviceArea}
                onChange={(e) => setSettings({ ...settings, serviceArea: e.target.value })}
                placeholder="e.g. Asheville, Western North Carolina"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={settings.targetAudience}
                onChange={(e) => setSettings({ ...settings, targetAudience: e.target.value })}
                placeholder="e.g. Locals, Tourists, Retirees"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultStatus">Default Article Status</Label>
              <select
                id="defaultStatus"
                value={settings.defaultArticleStatus || 'draft'}
                onChange={(e) => setSettings({ ...settings, defaultArticleStatus: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // API Configuration Content
  const renderApiConfig = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Configuration</h1>
          <p className="text-muted-foreground">Configure third-party service integrations</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <CheckCircle size={14} className="mr-1" /> Auto-Save Enabled
          </Badge>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={apiConfigTab} onValueChange={(v) => setApiConfigTab(v as 'openai' | 'google' | 'elevenlabs' | 'weather' | 'payments')} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <Sparkles size={16} /> OpenAI
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Sparkles size={16} /> Google AI
          </TabsTrigger>
          <TabsTrigger value="elevenlabs" className="flex items-center gap-2">
            <Volume2 size={16} /> ElevenLabs
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2">
            <Cloud size={16} /> Weather
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign size={16} /> Payments
          </TabsTrigger>
        </TabsList>

        {/* OpenAI Tab */}
        <TabsContent value="openai" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Sparkles className="text-green-700" size={24} />
                </div>
                <div>
                  <CardTitle>OpenAI API Configuration</CardTitle>
                  <CardDescription>
                    Powers AI image generation (DALL-E 3) and optional text features.{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Get your API key here
                    </a>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="openaiKey">OpenAI API Key *</Label>
                <div className="flex gap-2">
                  <Input
                    id="openaiKey"
                    type="password"
                    value={settings.openaiApiKey || ''}
                    onChange={(e) => {
                      setSettings({ ...settings, openaiApiKey: e.target.value });
                      localStorage.setItem('openai_api_key', e.target.value);
                    }}
                    placeholder="sk-..."
                    className="font-mono flex-1"
                  />
                  <Button
                    variant="secondary"
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
                          showMessage('success', 'API Key Valid! OpenAI services are ready.');
                        } else {
                          showMessage('error', 'API Key Invalid. Please check your key.');
                        }
                      } catch {
                        showMessage('error', 'API Key Test Failed');
                      }
                    }}
                  >
                    Test Key
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for AI image generation. Your key is stored securely.
                </p>
              </div>

              {/* DALL-E Settings */}
              <Card className="bg-blue-50/50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                    <ImageIcon size={18} /> DALL-E 3 Image Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dalleQuality">Image Quality</Label>
                      <select
                        id="dalleQuality"
                        value={settings.dalleQuality || 'standard'}
                        onChange={(e) => setSettings({ ...settings, dalleQuality: e.target.value as 'standard' | 'hd' })}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="standard">Standard ($0.04)</option>
                        <option value="hd">HD ($0.08)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dalleStyle">Image Style</Label>
                      <select
                        id="dalleStyle"
                        value={settings.dalleStyle || 'natural'}
                        onChange={(e) => setSettings({ ...settings, dalleStyle: e.target.value as 'natural' | 'vivid' })}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="natural">Natural (Realistic)</option>
                        <option value="vivid">Vivid (Dramatic)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dalleSize">Default Size</Label>
                      <select
                        id="dalleSize"
                        value={settings.dalleSize || '1792x1024'}
                        onChange={(e) => setSettings({ ...settings, dalleSize: e.target.value as '1024x1024' | '1792x1024' | '1024x1792' })}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="1024x1024">Square (1024×1024)</option>
                        <option value="1792x1024">Landscape (1792×1024)</option>
                        <option value="1024x1792">Portrait (1024×1792)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Info */}
              <Card className="bg-amber-50/50 border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                    <AlertCircle size={18} /> Pricing & Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li><strong>Standard:</strong> $0.040 per image (1024×1024), $0.080 (larger)</li>
                    <li><strong>HD:</strong> 2× standard price</li>
                    <li>Images are generated on-demand, URLs valid for 1 hour</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google AI Tab */}
        <TabsContent value="google" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Sparkles className="text-blue-700" size={24} />
                </div>
                <div>
                  <CardTitle>Google Generative AI (Gemini)</CardTitle>
                  <CardDescription>
                    Powers the chat assistant, AI article generation, and content tools.{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Get your API key here
                    </a>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="geminiKey">Gemini API Key *</Label>
                <div className="flex gap-2">
                  <Input
                    id="geminiKey"
                    type="password"
                    value={settings.geminiApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    placeholder="AIza..."
                    className="font-mono flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!settings.geminiApiKey) {
                        showMessage('error', 'Please enter an API key first');
                        return;
                      }
                      try {
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${settings.geminiApiKey}`);
                        if (response.ok) {
                          showMessage('success', 'API Key Valid! Gemini AI services are ready.');
                        } else {
                          showMessage('error', 'API Key Invalid. Please check your key.');
                        }
                      } catch {
                        showMessage('error', 'API Key Test Failed');
                      }
                    }}
                  >
                    Test Key
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for AI article writing, chat assistant, and content tools.
              </p>
            </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${settings.geminiApiKey ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <Badge variant={settings.geminiApiKey ? 'default' : 'secondary'} className={settings.geminiApiKey ? 'bg-green-600' : 'bg-amber-600'}>
                  {settings.geminiApiKey ? 'Configured' : 'Not Configured'}
                </Badge>
                <span className={`text-sm ${settings.geminiApiKey ? 'text-green-700' : 'text-amber-700'}`}>
                  {settings.geminiApiKey ? 'AI features are ready' : 'AI features disabled'}
                </span>
              </div>

              {/* Model Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="geminiModel">Default Model</Label>
                  <select
                    id="geminiModel"
                    value={settings.geminiModel || 'gemini-2.5-flash'}
                    onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Balanced)</option>
                    <option value="gemini-pro">Gemini Pro (Most capable)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ttsVoice">Text-to-Speech Voice</Label>
                  <select
                    id="ttsVoice"
                    value={settings.ttsVoice || 'en-US-Neural2-F'}
                    onChange={(e) => setSettings({ ...settings, ttsVoice: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <optgroup label="Female Voices">
                      <option value="en-US-Neural2-F">Neural2-F (Warm)</option>
                      <option value="en-US-Neural2-C">Neural2-C (Clear)</option>
                      <option value="en-US-Neural2-E">Neural2-E (Expressive)</option>
                    </optgroup>
                    <optgroup label="Male Voices">
                      <option value="en-US-Neural2-A">Neural2-A (Deep)</option>
                      <option value="en-US-Neural2-D">Neural2-D (Friendly)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Free Tier Info */}
              <Card className="bg-green-50/50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-900">Free Tier Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                    <li>15 requests per minute</li>
                    <li>1,500 requests per day</li>
                    <li>1 million tokens per day</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ElevenLabs Tab */}
        <TabsContent value="elevenlabs" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Volume2 className="text-purple-700" size={24} />
                </div>
                <div>
                  <CardTitle>ElevenLabs Text-to-Speech</CardTitle>
                  <CardDescription>
                    High-quality AI voice synthesis for chat assistant.{' '}
                    <a href="https://elevenlabs.io/app/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Get your API key here
                    </a>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="elevenLabsKey">ElevenLabs API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="elevenLabsKey"
                    type="password"
                    value={settings.elevenLabsApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, elevenLabsApiKey: e.target.value })}
                    placeholder="Enter your ElevenLabs API key..."
                    className="font-mono flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!settings.elevenLabsApiKey) {
                        showMessage('error', 'Please enter an API key first');
                        return;
                      }
                      try {
                        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                          headers: { 'xi-api-key': settings.elevenLabsApiKey }
                        });
                        if (response.ok) {
                          showMessage('success', 'API Key Valid! ElevenLabs is ready.');
                        } else {
                          showMessage('error', 'API Key Invalid. Please check your key.');
                        }
                      } catch {
                        showMessage('error', 'API Key Test Failed');
                      }
                    }}
                  >
                    Test Key
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key is stored securely and used only for voice synthesis.
                </p>
              </div>

              {/* Voice Presets */}
              <div className="space-y-2">
                <Label>Voice Preset</Label>
                <select
                  value={settings.elevenLabsVoiceId || ''}
                  onChange={(e) => setSettings({ ...settings, elevenLabsVoiceId: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a voice preset...</option>
                  <option value="21m00Tcm4TlvDq8ikWAM">Rachel - News Anchor (Professional, clear)</option>
                  <option value="pNInz6obpgDQGcFmaJgB">Adam - Authoritative (Deep, confident)</option>
                  <option value="EXAVITQu4vr4xnSDxMaL">Bella - Friendly (Warm, conversational)</option>
                  <option value="AZnzlk1XvdvUeBnXmlld">Domi - Energetic (Upbeat, engaging)</option>
                  <option value="MF3mGyEYCl7XYWbV9V6O">Elli - Young Female (Friendly, casual)</option>
                  <option value="TxGEqnHWrfWFTfGW9XjX">Josh - Young Male (Casual, relatable)</option>
                  <option value="custom">Custom Voice ID...</option>
                </select>
              </div>

              {/* Custom Voice ID (shown when custom selected) */}
              {settings.elevenLabsVoiceId === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customVoiceId">Custom Voice ID</Label>
                  <Input
                    id="customVoiceId"
                    placeholder="Enter your custom voice ID..."
                    className="font-mono"
                    onChange={(e) => setSettings({ ...settings, elevenLabsVoiceId: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find voice IDs in your{' '}
                    <a href="https://elevenlabs.io/app/voice-library" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      ElevenLabs Voice Library
                    </a>
                  </p>
                </div>
              )}

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>AI Model</Label>
                <select
                  value={settings.elevenLabsModel || 'eleven_turbo_v2'}
                  onChange={(e) => setSettings({ ...settings, elevenLabsModel: e.target.value as 'eleven_turbo_v2' | 'eleven_monolingual_v1' | 'eleven_multilingual_v2' })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="eleven_turbo_v2">Turbo v2 - Fastest (Recommended for chat)</option>
                  <option value="eleven_monolingual_v1">Monolingual v1 - English, balanced</option>
                  <option value="eleven_multilingual_v2">Multilingual v2 - Highest quality</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Turbo v2 is optimized for real-time applications with lowest latency.
                </p>
              </div>

              {/* Voice Settings */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Voice Settings</CardTitle>
                  <CardDescription>Fine-tune the voice characteristics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stability Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Stability</Label>
                      <span className="text-sm text-muted-foreground">{Math.round((settings.elevenLabsStability ?? 0.5) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.elevenLabsStability ?? 0.5}
                      onChange={(e) => setSettings({ ...settings, elevenLabsStability: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">Higher = more consistent, Lower = more expressive</p>
                  </div>

                  {/* Similarity Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Similarity Boost</Label>
                      <span className="text-sm text-muted-foreground">{Math.round((settings.elevenLabsSimilarity ?? 0.75) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.elevenLabsSimilarity ?? 0.75}
                      onChange={(e) => setSettings({ ...settings, elevenLabsSimilarity: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">How closely to match the original voice</p>
                  </div>

                  {/* Style Slider (v2 models only) */}
                  {settings.elevenLabsModel === 'eleven_multilingual_v2' && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Style</Label>
                        <span className="text-sm text-muted-foreground">{Math.round((settings.elevenLabsStyle ?? 0) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.elevenLabsStyle ?? 0}
                        onChange={(e) => setSettings({ ...settings, elevenLabsStyle: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">Adds expressiveness (only for Multilingual v2)</p>
                    </div>
                  )}

                  {/* Toggles */}
                  <div className="flex flex-col gap-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.elevenLabsSpeakerBoost ?? true}
                        onChange={(e) => setSettings({ ...settings, elevenLabsSpeakerBoost: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div>
                        <div className="text-sm font-medium">Speaker Boost</div>
                        <div className="text-xs text-muted-foreground">Enhanced voice clarity and presence</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.elevenLabsStreaming ?? false}
                        onChange={(e) => setSettings({ ...settings, elevenLabsStreaming: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div>
                        <div className="text-sm font-medium">Streaming Mode</div>
                        <div className="text-xs text-muted-foreground">Lower latency, audio starts faster</div>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Voice Preview */}
              <div className="space-y-2">
                <Label>Voice Preview</Label>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!settings.elevenLabsApiKey || !settings.elevenLabsVoiceId || settings.elevenLabsVoiceId === 'custom'}
                  onClick={async () => {
                    if (!settings.elevenLabsApiKey || !settings.elevenLabsVoiceId) return;
                    showMessage('success', 'Generating preview...');
                    try {
                      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${settings.elevenLabsVoiceId}`, {
                        method: 'POST',
                        headers: {
                          'Accept': 'audio/mpeg',
                          'Content-Type': 'application/json',
                          'xi-api-key': settings.elevenLabsApiKey,
                        },
                        body: JSON.stringify({
                          text: "Hello! I'm your AI assistant. How can I help you today?",
                          model_id: settings.elevenLabsModel || 'eleven_turbo_v2',
                          voice_settings: {
                            stability: settings.elevenLabsStability ?? 0.5,
                            similarity_boost: settings.elevenLabsSimilarity ?? 0.75,
                            style: settings.elevenLabsStyle ?? 0,
                            use_speaker_boost: settings.elevenLabsSpeakerBoost ?? true,
                          },
                        }),
                      });
                      if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play();
                        showMessage('success', 'Playing preview...');
                      } else {
                        showMessage('error', 'Preview failed. Check your API key.');
                      }
                    } catch {
                      showMessage('error', 'Preview failed');
                    }
                  }}
                >
                  <Volume2 size={16} className="mr-2" /> Test Voice
                </Button>
                <p className="text-xs text-muted-foreground">
                  Hear a sample with current settings before saving
                </p>
              </div>

              {/* TTS Provider Selection */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Text-to-Speech Provider</CardTitle>
                  <CardDescription>Choose which service powers the chat assistant voice</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors">
                      <input
                        type="radio"
                        name="ttsProvider"
                        value="google"
                        checked={settings.ttsProvider !== 'elevenlabs'}
                        onChange={() => setSettings({ ...settings, ttsProvider: 'google' })}
                        className="h-4 w-4"
                      />
                      <div>
                        <div className="font-medium">Google Cloud TTS</div>
                        <div className="text-xs text-muted-foreground">Free tier available, good quality neural voices</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors">
                      <input
                        type="radio"
                        name="ttsProvider"
                        value="elevenlabs"
                        checked={settings.ttsProvider === 'elevenlabs'}
                        onChange={() => setSettings({ ...settings, ttsProvider: 'elevenlabs' })}
                        className="h-4 w-4"
                        disabled={!settings.elevenLabsApiKey || !settings.elevenLabsVoiceId}
                      />
                      <div>
                        <div className="font-medium">ElevenLabs</div>
                        <div className="text-xs text-muted-foreground">
                          Premium quality, natural-sounding voices
                          {(!settings.elevenLabsApiKey || !settings.elevenLabsVoiceId) && (
                            <span className="text-amber-600 ml-1">(Configure API key and voice first)</span>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card className={settings.elevenLabsApiKey && settings.elevenLabsVoiceId ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    {settings.elevenLabsApiKey && settings.elevenLabsVoiceId ? (
                      <>
                        <CheckCircle className="text-green-600" size={20} />
                        <div>
                          <p className="font-medium text-green-800">ElevenLabs Configured</p>
                          <p className="text-sm text-green-700">Voice ID: {settings.elevenLabsVoiceId}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="text-amber-600" size={20} />
                        <div>
                          <p className="font-medium text-amber-800">Setup Required</p>
                          <p className="text-sm text-amber-700">Add your API key and voice ID to enable ElevenLabs</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <Cloud className="text-cyan-700" size={24} />
                </div>
                <div>
                  <CardTitle>OpenWeatherMap API</CardTitle>
                  <CardDescription>
                    Provides real-time weather data for your location.{' '}
                    <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Get your free API key here
                    </a>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="weatherKey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="weatherKey"
                    type="password"
                    value={settings.weatherApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, weatherApiKey: e.target.value })}
                    placeholder="Enter your OpenWeatherMap API key"
                    className="font-mono flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!settings.weatherApiKey) {
                        showMessage('error', 'Please enter an API key first');
                        return;
                      }
                      try {
                        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&units=imperial&appid=${settings.weatherApiKey}`);
                        if (response.ok) {
                          showMessage('success', 'API Key Valid! Weather widget will now work.');
                        } else {
                          showMessage('error', 'API Key Invalid. Please check your key.');
                        }
                      } catch {
                        showMessage('error', 'Connection failed. Check your API key.');
                      }
                    }}
                  >
                    Test Key
                  </Button>
                </div>
              </div>

              {/* Default Location */}
              <div className="space-y-2">
                <Label htmlFor="defaultLocation">Default Location</Label>
                <Input
                  id="defaultLocation"
                  value={settings.defaultLocation || 'Asheville, NC'}
                  onChange={(e) => setSettings({ ...settings, defaultLocation: e.target.value })}
                  placeholder="City, State or Coordinates"
                />
                <p className="text-sm text-muted-foreground">Fallback location when geolocation is unavailable.</p>
              </div>

              {/* Free Tier Info */}
              <Card className="bg-cyan-50/50 border-cyan-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-cyan-900">Free Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-cyan-800 space-y-1 list-disc list-inside">
                    <li>1,000 API calls per day</li>
                    <li>60 calls per minute</li>
                    <li>Perfect for local news sites</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="text-purple-700" size={24} />
                </div>
                <div>
                  <CardTitle>Payment Processor Integration</CardTitle>
                  <CardDescription>
                    Configure Stripe, PayPal, or other payment systems for subscriptions and business listings.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 border rounded-lg p-8 text-center">
                <DollarSign className="mx-auto text-muted-foreground mb-3" size={48} />
                <p className="text-muted-foreground font-medium mb-1">Payment integrations coming soon</p>
                <p className="text-sm text-muted-foreground">Stripe, PayPal, and other payment processors will be available in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Security Best Practices */}
      <Card className="bg-purple-50/50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-purple-900">
            <Info size={18} /> API Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-purple-800 space-y-2 list-disc list-inside">
            <li><strong>Store Keys Securely:</strong> All API keys are saved securely to your database.</li>
            <li><strong>Use Environment Variables:</strong> For production, configure API keys in your <code className="bg-white px-1 py-0.5 rounded">.env</code> file.</li>
            <li><strong>Monitor Usage:</strong> Check your API provider dashboards regularly.</li>
            <li><strong>Rotate Keys:</strong> Periodically regenerate API keys for security.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  // Roles & Permissions Content
  const renderRolesAndPermissions = () => {
    const roles = Object.keys(ROLE_PERMISSIONS) as UserRole[];
    const permissionKeys = Object.keys(PERMISSION_LABELS) as (keyof UserPermissions)[];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
            <p className="text-muted-foreground">Configure what each user role can do in the system</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetRolePermissions}>
              <RefreshCw size={16} className="mr-2" /> Reset to Defaults
            </Button>
            <Button onClick={handleSaveRolePermissions} disabled={saving}>
              {saving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roles.map(role => (
            <Card key={role} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{ROLE_LABELS[role]}</CardTitle>
                    <CardDescription className="text-xs">{ROLE_DESCRIPTIONS[role]}</CardDescription>
                  </div>
                  <Shield className="text-blue-600" size={20} />
                </div>
              </CardHeader>
              <CardContent className="p-4 max-h-80 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {permissionKeys.map(permKey => {
                    const value = customRolePermissions[role][permKey];
                    const isEnabled = value === true || value === 'all';
                    const isPartial = value === 'own';

                    return (
                      <Button
                        key={permKey}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePermission(role, permKey)}
                        className={`justify-between h-auto py-2 px-3 text-xs font-medium ${
                          isEnabled
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : isPartial
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="truncate pr-2">{PERMISSION_LABELS[permKey]}</span>
                        {isEnabled ? (
                          <CheckCircle size={14} className="flex-shrink-0" />
                        ) : isPartial ? (
                          <Badge variant="secondary" className="text-[10px] px-1 h-4">OWN</Badge>
                        ) : (
                          <X size={14} className="flex-shrink-0" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legend */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-8">
              <span className="font-medium text-sm">Legend:</span>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 border border-green-200 rounded"></span>
                <span className="text-sm">Full Permission</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></span>
                <span className="text-sm">Own Content Only</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-muted border rounded"></span>
                <span className="text-sm">No Permission</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <Card className="rounded-none border-x-0 border-t-0">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  {getAgentIcon(agentKey)}
                </div>
                <div>
                  <CardTitle className="text-2xl">{agentData.label}</CardTitle>
                  <CardDescription className="mt-1 max-w-2xl">{agentData.instruction}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Content: Chat + Tool Panels */}
          <div className="flex-grow flex gap-6 p-6 overflow-hidden">
            {/* Chat Panel */}
            <Card className="flex-grow flex flex-col overflow-hidden">
              <ScrollArea className="flex-grow p-6">
                <div className="space-y-4">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.role === 'user' ? (
                          <div className="leading-relaxed">{msg.text}</div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: formatAiResponse(msg.text) }} className="prose prose-sm max-w-none" />
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-muted/30">
                <div className="flex gap-3">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiChat()}
                    placeholder="Type your message..."
                    className="flex-grow"
                  />
                  <Button
                    onClick={handleAiChat}
                    disabled={isChatLoading}
                  >
                    <MessageSquare size={18}/>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Right Sidebar: Agent-Specific Tools */}
            <div className="w-[420px] flex flex-col gap-4 overflow-y-auto pr-2">
              {/* MASTER Agent Tools */}
              {activeTab === 'MASTER' && (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Terminal size={18} className="text-muted-foreground" /> Editor-in-Chief Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={handleBroadcastDirective} className="w-full">
                        <Sparkles size={16} className="mr-2" /> Broadcast Directives
                      </Button>
                      <Button variant="secondary" onClick={handleReviewCalendar} className="w-full">
                        Review Editorial Calendar
                      </Button>
                      <Button variant="secondary" onClick={handleApprovePublication} className="w-full">
                        Approve for Publication
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Articles in Review</span>
                        <Badge variant="secondary">{articles.filter(a => a.status?.toLowerCase() === 'review').length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Ready to Publish</span>
                        <Badge className="bg-primary">{articles.filter(a => a.status?.toLowerCase() === 'review').length}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* JOURNALIST Agent Tools */}
              {activeTab === 'JOURNALIST' && (
                <>
                  <Card className="bg-primary border-0">
                    <CardContent className="pt-6">
                      <Button
                        variant="secondary"
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
                        className="w-full bg-white text-primary hover:bg-white/90"
                      >
                        <Sparkles size={18} className="mr-2 text-primary" /> Create New Article
                      </Button>
                      <p className="text-xs text-white/90 mt-2 text-center">Use AI to generate ideas or write manually</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" /> Submit Draft
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {articles.filter(a => a.status?.toLowerCase() === 'draft').length === 0 ? (
                        <div className="bg-muted/50 border rounded-lg p-6 text-center">
                          <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm font-medium mb-1">No Draft Articles</p>
                          <p className="text-xs text-muted-foreground">Create a draft using the button above.</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Select Draft Article ({articles.filter(a => a.status?.toLowerCase() === 'draft').length} available)
                            </Label>
                            <select
                              value={selectedArticleForAction}
                              onChange={e => setSelectedArticleForAction(e.target.value)}
                              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">Choose article...</option>
                              {articles.filter(a => a.status?.toLowerCase() === 'draft').map(article => (
                                <option key={article.id} value={article.id}>{article.title}</option>
                              ))}
                            </select>
                          </div>
                          <Button
                            onClick={handleSubmitForReview}
                            disabled={!selectedArticleForAction}
                            className="w-full bg-amber-500 hover:bg-amber-600"
                          >
                            <ArrowRight size={14} className="mr-2" /> Submit for Review
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-2xl font-bold">{articles.filter(a => a.status?.toLowerCase() === 'draft').length}</div>
                          <div className="text-xs text-muted-foreground mt-1">Drafts</div>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-2xl font-bold text-amber-600">{articles.filter(a => a.status?.toLowerCase() === 'review').length}</div>
                          <div className="text-xs text-muted-foreground mt-1">In Review</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* EDITOR Agent Tools */}
              {activeTab === 'EDITOR' && (
                <>
                  <Card>
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Eye size={16} className="text-muted-foreground" /> Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Button onClick={handleReviewQueue} className="w-full">
                        <Eye size={14} className="mr-2" /> View Review Queue
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle size={16} className="text-muted-foreground" /> Editorial Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {articles.filter(a => a.status?.toLowerCase() === 'review').length === 0 ? (
                        <div className="bg-muted/50 border rounded-lg p-6 text-center">
                          <Eye size={32} className="mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm font-medium mb-1">Review Queue Empty</p>
                          <p className="text-xs text-muted-foreground">No articles are currently awaiting review.</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Select Article to Review ({articles.filter(a => a.status?.toLowerCase() === 'review').length} in queue)
                            </Label>
                            <select
                              value={selectedArticleForAction}
                              onChange={e => setSelectedArticleForAction(e.target.value)}
                              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">Choose article...</option>
                              {articles.filter(a => a.status?.toLowerCase() === 'review').map(article => (
                                <option key={article.id} value={article.id}>
                                  {article.title} - by {article.author}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            onClick={handleCheckGrammar}
                            disabled={editorAiLoading || !selectedArticleForAction}
                            className="w-full"
                          >
                            {workflowAction === 'grammar' ? (
                              <><RefreshCw size={14} className="animate-spin mr-2" /> Reviewing...</>
                            ) : (
                              <><CheckCircle size={14} className="mr-2" /> Run Editorial Review</>
                            )}
                          </Button>
                          <Button
                            onClick={handleForwardToChief}
                            disabled={!selectedArticleForAction}
                            className="w-full bg-primary hover:bg-primary/90"
                          >
                            <ArrowRight size={14} className="mr-2" /> Approve & Publish
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-2xl font-bold text-amber-600">{articles.filter(a => a.status?.toLowerCase() === 'review').length}</div>
                          <div className="text-xs text-muted-foreground mt-1">Pending</div>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-2xl font-bold text-emerald-600">{articles.filter(a => a.status?.toLowerCase() === 'published').length}</div>
                          <div className="text-xs text-muted-foreground mt-1">Published</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                  // Pass the updated article directly to avoid state timing issues
                  await handleSaveAgentArticle(false, updatedArticle);
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
              className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <RichTextEditor
                    content={agentArticle.content || ''}
                    onChange={(html) => setAgentArticle({...agentArticle, content: html})}
                    placeholder="Write your story here..."
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
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Workflow Status</label>
                      <select value={agentArticle.status || 'draft'} onChange={e => setAgentArticle({...agentArticle, status: e.target.value as 'draft' | 'review' | 'published'})} className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white">
                        <option value="draft">📝 Draft (Journalist)</option>
                        <option value="review">👁️ Review (Editor)</option>
                        <option value="published">✅ Published</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Author</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAuthorDropdown(!showAuthorDropdown)}
                          className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {agentArticle.authorPhotoURL ? (
                              <Image
                                src={agentArticle.authorPhotoURL}
                                alt={agentArticle.author || 'Author'}
                                width={24}
                                height={24}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                {(agentArticle.author || 'S')[0].toUpperCase()}
                              </div>
                            )}
                            <span>{agentArticle.author || 'Select author'}</span>
                          </div>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${showAuthorDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showAuthorDropdown && (
                          <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                            {/* Team Members Section */}
                            {authorOptions.length > 0 && (
                              <>
                                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                                  Team Members
                                </div>
                                {authorOptions.map((author) => (
                                  <button
                                    key={author.id}
                                    type="button"
                                    onClick={() => {
                                      setAgentArticle({
                                        ...agentArticle,
                                        author: author.displayName,
                                        authorId: author.id,
                                        authorPhotoURL: author.photoURL,
                                      });
                                      setShowAuthorDropdown(false);
                                    }}
                                    className={`w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between ${
                                      agentArticle.authorId === author.id ? 'bg-blue-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {author.photoURL ? (
                                        <Image
                                          src={author.photoURL}
                                          alt={author.displayName}
                                          width={28}
                                          height={28}
                                          className="rounded-full object-cover"
                                          style={{ width: 28, height: 28 }}
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                          {author.displayName[0]?.toUpperCase()}
                                        </div>
                                      )}
                                      <div>
                                        <div className="text-sm font-medium text-slate-900">{author.displayName}</div>
                                        <div className="text-xs text-slate-500 capitalize">{author.role.replace(/-/g, ' ')}</div>
                                      </div>
                                    </div>
                                    {agentArticle.authorId === author.id && <CheckCircle size={16} className="text-blue-600" />}
                                  </button>
                                ))}
                              </>
                            )}

                            {/* AI Journalists Section - Only for admins */}
                            {userProfile?.role === 'admin' && aiJournalists.length > 0 && (
                              <>
                                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-cyan-50 border-y border-slate-100 flex items-center gap-1.5">
                                  <Bot size={12} className="text-cyan-600" />
                                  AI Journalists
                                </div>
                                {aiJournalists.map((journalist) => (
                                  <button
                                    key={`ai-${journalist.id}`}
                                    type="button"
                                    onClick={() => {
                                      setAgentArticle({
                                        ...agentArticle,
                                        author: journalist.name,
                                        authorId: `ai-${journalist.id}`,
                                        authorPhotoURL: journalist.photoURL,
                                      });
                                      setShowAuthorDropdown(false);
                                    }}
                                    className={`w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between ${
                                      agentArticle.authorId === `ai-${journalist.id}` ? 'bg-cyan-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="relative">
                                        {journalist.photoURL ? (
                                          <Image
                                            src={journalist.photoURL}
                                            alt={journalist.name}
                                            width={28}
                                            height={28}
                                            className="rounded-full object-cover"
                                            style={{ width: 28, height: 28 }}
                                          />
                                        ) : (
                                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                            {journalist.name[0]?.toUpperCase()}
                                          </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-500 rounded-full flex items-center justify-center">
                                          <Bot size={8} className="text-white" />
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-slate-900">{journalist.name}</div>
                                        <div className="text-xs text-slate-500">{journalist.title}</div>
                                      </div>
                                    </div>
                                    {agentArticle.authorId === `ai-${journalist.id}` && <CheckCircle size={16} className="text-cyan-600" />}
                                  </button>
                                ))}
                              </>
                            )}

                            {authorOptions.length === 0 && aiJournalists.length === 0 && (
                              <div className="px-3 py-2.5 text-sm text-slate-500">No authors available. Add users with author roles first.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Category</label>
                      <select value={agentArticle.category || ''} onChange={e => setAgentArticle({...agentArticle, category: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 bg-white">
                        <option value="">Select category...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AI Article Generator */}
                  <div className="bg-gradient-to-r from-primary/10 to-slate-50 rounded-xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" /> AI Article Generator
                    </h3>
                    <p className="text-xs text-slate-600 mb-4">AI researches topic & writes full article</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Topic *</label>
                        <input type="text" value={selectedResearchTopic} onChange={e => setSelectedResearchTopic(e.target.value)} placeholder="e.g., 'downtown construction project'" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white" onKeyDown={e => e.key === 'Enter' && handleGetArticleIdeas()} />
                      </div>
                      <p className="text-xs text-slate-500">Category: <strong>{agentArticle.category || 'Not selected'}</strong> (change above)</p>
                      <button onClick={handleGetArticleIdeas} disabled={editorAiLoading || !selectedResearchTopic || !agentArticle.category} className="w-full py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                        {workflowAction === 'research' ? <><RefreshCw size={16} className="animate-spin" /> Generating Ideas...</> : <><Sparkles size={16} /> Get Article Ideas</>}
                      </button>
                    </div>
                  </div>

                  {/* Article Suggestions */}
                  {showSuggestions && articleSuggestions.length > 0 && (
                    <div className="bg-white rounded-xl border border-primary/30 shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/20 px-5 py-4 border-b border-primary/20">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Sparkles size={16} className="text-primary" /> Choose an Article
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Click any idea to create the full article</p>
                      </div>
                      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {articleSuggestions.map((suggestion, idx) => (
                          <button key={idx} onClick={() => handleCreateFromSuggestion(suggestion)} disabled={editorAiLoading} className="w-full text-left p-4 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg hover:border-primary hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                {idx + 1}
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-primary transition-colors">{suggestion.title}</h4>
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

                  {/* Select from Media Library */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <ImageIcon size={16} className="text-blue-600" /> Media Library
                    </h3>
                    <p className="text-xs text-slate-600 mb-4">Select an image from your uploaded media</p>
                    <button onClick={() => setShowMediaPicker(true)} className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm">
                      <ImageIcon size={14} /> Select from Library
                    </button>
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

                  {/* Media Picker Modal */}
                  <MediaPickerModal
                    open={showMediaPicker}
                    onClose={() => setShowMediaPicker(false)}
                    onSelect={(media) => {
                      const m = Array.isArray(media) ? media[0] : media;
                      setAgentArticle({...agentArticle!, imageUrl: m.url, featuredImage: m.url});
                      setShowMediaPicker(false);
                    }}
                    allowedTypes={['image']}
                    defaultFolder="articles"
                    title="Select Featured Image"
                  />

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
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
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
    return (
      <CategoryManager currentUserId={currentUser?.uid || ''} />
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
    <div className="fixed inset-0 bg-background flex flex-col">
      <Toaster position="top-right" richColors />

      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <UserCog size={18} />
            <span className="font-medium">
              Viewing as: {userProfile?.displayName || userProfile?.email}
              <span className="ml-2 text-amber-100">({userProfile?.role})</span>
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-amber-600 hover:bg-amber-50 border-amber-300"
            onClick={() => {
              stopImpersonation();
              toast.success('Returned to your account');
            }}
          >
            <X size={14} className="mr-1" /> Exit Impersonation
          </Button>
        </div>
      )}

      {/* Global Header */}
      <AdminHeader
        settings={settings}
        currentUser={currentUser ? { ...currentUser, photoURL: userProfile?.photoURL } : null}
        onSettingsClick={() => setActiveTab('settings')}
        onAccountClick={() => setActiveTab('my-account')}
        onSignOut={signOut}
        version={NEWSROOM_VERSION}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar Navigation */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false); // Close mobile menu when navigating
          }}
          menuSections={menuSections}
          toggleMenuSection={toggleMenuSection}
          onClearChat={() => setChatHistory([])}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-grow bg-muted/30 overflow-y-auto">
          <div className="max-w-[1800px] mx-auto p-6 px-4 md:p-6">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'articles' && <ArticlesAdmin />}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'infrastructure' && renderInfrastructure()}
            {activeTab === 'categories' && renderCategories()}
            {activeTab === 'media' && <MediaManager />}
            {activeTab === 'api-config' && renderApiConfig()}
            {activeTab === 'roles' && renderRolesAndPermissions()}
            {isAgentView(activeTab) && renderAgentChat()}

            {/* AI Journalists Management */}
            {activeTab === 'ai-journalists' && currentUser && (
              <AIJournalistManager
                categories={categories}
                currentUserId={currentUser.uid}
              />
            )}

            {/* Components Section */}
            {activeTab === 'directory' && <DirectoryAdmin />}
            {activeTab === 'advertising' && <AdvertisingAdmin />}
            {activeTab === 'blog' && <BlogAdmin />}
            {activeTab === 'events' && <EventsAdmin />}

            {/* Modules Section Placeholder */}
            {activeTab === 'modules' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plug className="h-5 w-5 text-cyan-600" />
                    Module Manager
                  </CardTitle>
                  <CardDescription>Install, configure, and manage system modules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Plug className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Coming Soon</p>
                    <p className="text-sm">Module management features are under development</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Account Section */}
            {activeTab === 'my-account' && currentUser && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold overflow-hidden">
                          {userProfile?.photoURL || currentUser.photoURL ? (
                            <img
                              src={userProfile?.photoURL || currentUser.photoURL || ''}
                              alt={currentUser.displayName || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (currentUser.displayName?.[0] || currentUser.email?.[0] || 'A').toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <h2 className="text-2xl font-bold">{currentUser.displayName || 'User'}</h2>
                        <p className="text-muted-foreground">{currentUser.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                          <Badge variant="secondary" className="capitalize">
                            <Shield className="h-3 w-3 mr-1" />
                            {userProfile?.role?.replace('-', ' ') || 'User'}
                          </Badge>
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            Joined {currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Account Details
                    </CardTitle>
                    <CardDescription>Manage your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-displayName">Display Name</Label>
                        <Input id="admin-displayName" defaultValue={currentUser.displayName || ''} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email Address</Label>
                        <Input id="admin-email" type="email" value={currentUser.email || ''} disabled />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-end">
                      <Button>Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Status</CardTitle>
                    <CardDescription>Your current plan and role information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase">Current Plan</p>
                        <h3 className="text-2xl font-bold text-primary capitalize">
                          {userProfile?.accountType || 'Free'} Member
                        </h3>
                      </div>
                      <Button variant="outline">Upgrade Plan</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>

        {/* Status Modal for AI Generation Progress */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="max-w-sm w-full mx-4 text-center">
              <CardContent className="pt-6">
                <div className="text-6xl mb-4 animate-pulse">
                  {statusModalIcon}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Creating Article
                </h3>
                <p className="text-muted-foreground mb-4">
                  {statusModalMessage}
                </p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
