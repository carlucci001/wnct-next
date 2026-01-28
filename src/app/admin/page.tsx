'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Article } from '@/types/article';
import {
  LayoutDashboard, FileText, Settings, Users, Database, User,
  Plus, Trash2, Edit, Save, X, RefreshCw, CheckCircle, CheckCircle2, LogOut,
  Search, Image as ImageIcon, Eye, EyeOff, Bell, HelpCircle,
  Download, Cloud, Palette, ExternalLink, MessageCircle, Activity,
  ChevronDown, BarChart3, Clock, TrendingUp, Zap, PenTool,
  MessageSquare, UserPlus, ListOrdered, Server, Plug, Shield,
  Sparkles, DollarSign, AlertCircle, Info, Bot, ShieldAlert, Share2,
  Send, Lightbulb, Folder, FolderPlus, Upload, Sliders, Terminal, ArrowRight, Volume2,
  CheckSquare, Square, MinusSquare, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Mail, UserCheck, UserX, Filter, Phone, Calendar, ChevronsLeft, ChevronsRight, AlertTriangle, Building2,
  UserCog, MoreHorizontal, Wrench, Menu, GripVertical, ToggleLeft, ToggleRight, Hash, Type, FileSearch, Globe, Copy, BarChart, Target, Key, Heading, Link2, Twitter, Facebook, Instagram, Linkedin, Code, Wand2
} from 'lucide-react';
import { AGENT_PROMPTS, AgentType } from '@/data/prompts';
import { getAgentPrompt, AgentPromptData } from '@/lib/agentPrompts';
import { ROLE_PERMISSIONS, ROLE_LABELS, ROLE_DESCRIPTIONS, PERMISSION_LABELS, UserRole, UserPermissions } from '@/data/rolePermissions';
import { storageService } from '@/lib/storage';
import { batchFormatArticles, batchMigrateImages, formatArticleContent, batchAssignArticlesToUser, getArticleBySlug } from '@/lib/articles';
import { addCost, formatCost, getCategoryLabel, API_PRICING } from '@/lib/costs';
import { searchWithPerplexity, PerplexitySearchResult } from '@/lib/perplexitySearch';
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

// Dynamically import NewsletterDashboard
const NewsletterDashboard = dynamic(() => import('@/components/admin/newsletter/NewsletterDashboard'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import PersonaManager to avoid SSR issues
const PersonaManager = dynamic(() => import('@/components/admin/PersonaManager'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
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

// Dynamically import CommunityAdmin
const CommunityAdmin = dynamic(() => import('@/components/admin/CommunityAdmin'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import MenuManager
const MenuManager = dynamic(() => import('@/components/admin/MenuManager'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import ModuleManager
const ModuleManager = dynamic(() => import('@/components/admin/ModuleManager'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import SiteConfigManager
const SiteConfigManager = dynamic(() => import('@/components/admin/SiteConfigManager'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import CreditsDashboard
const CreditsDashboard = dynamic(() => import('@/components/admin/CreditsDashboard'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import AIConfigurator
const AIConfigurator = dynamic(() => import('@/components/admin/AIConfigurator'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import PaperPartnerAdmin
const PaperPartnerAdmin = dynamic(() => import('@/components/admin/PaperPartnerAdmin'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import CommentAdmin
const CommentAdmin = dynamic(() => import('@/components/admin/CommentAdmin'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import GoogleAnalyticsWidget
const GoogleAnalyticsWidget = dynamic(() => import('@/components/admin/GoogleAnalyticsWidget'), {
  ssr: false,
  loading: () => (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// Dynamically import AgentPromptEditor
const AgentPromptEditor = dynamic(() => import('@/components/admin/AgentPromptEditor'), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    </div>
  ),
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

type TabType = 'dashboard' | 'newsletters' | 'articles' | 'categories' | 'comments' | 'media' | 'users' | 'personas' | 'roles' | 'settings' | 'api-config' | 'infrastructure' | 'tools' | 'MASTER' | 'JOURNALIST' | 'EDITOR' | 'SEO' | 'SOCIAL' | 'GEO' | 'directory' | 'advertising' | 'blog' | 'events' | 'modules' | 'ai-journalists' | 'my-account' | 'community' | 'menus' | 'site-config' | 'credits' | 'paper-partners';

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
  darkModeLogoUrl?: string; // Optional dark mode logo (falls back to logoUrl)
  brandingMode?: 'text' | 'logo';
  showTagline?: boolean;
  defaultArticleStatus?: string;
  // API Keys
  openaiApiKey?: string;
  geminiApiKey?: string;
  perplexityApiKey?: string; // For real-time web search and fact-checking
  usePerplexityForManualCreation?: boolean; // Enable web search for manual article creation
  pexelsApiKey?: string; // For stock photo search (free tier: 200 requests/hour)
  weatherApiKey?: string;
  defaultLocation?: string;
  claudeCodeApiKey?: string; // For Claude Code API integration
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
  // Admin Chat Voice Configuration
  adminChatVoice?: {
    voiceId?: string;
    voiceName?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
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
  navigation: boolean;
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
    if (tabParam && ['dashboard', 'newsletters', 'articles', 'categories', 'comments', 'media', 'users', 'roles', 'settings', 'api-config', 'infrastructure', 'MASTER', 'JOURNALIST', 'EDITOR', 'SEO', 'SOCIAL', 'GEO', 'directory', 'advertising', 'blog', 'events', 'modules', 'ai-journalists', 'my-account', 'community', 'menus', 'site-config', 'credits'].includes(tabParam)) {
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
  const [uploadingDarkModeLogo, setUploadingDarkModeLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuSections, setMenuSections] = useState<MenuSections>({
    ai: true,              // Only AI Workforce open by default
    content: false,        // All others closed for accordion behavior
    components: false,
    navigation: false,
    modules: false,
    plugins: false,
    users: false,
    systemSettings: false,
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // AI Agent states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentAgentPrompt, setCurrentAgentPrompt] = useState<AgentPromptData | null>(null);

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
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);

  // Supabase Import states
  const [supabaseConfig, setSupabaseConfig] = useState({
    url: '',
    key: '',
    dateFrom: '',
    dateTo: '',
    importArticles: true,
    importImages: true,
    importCategories: true,
    importAuthors: true,
    clearFirst: false, // Clear all existing articles before import
  });
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [supabaseImporting, setSupabaseImporting] = useState(false);
  const [supabaseProgress, setSupabaseProgress] = useState({ current: 0, total: 0, message: '' });
  const [supabaseResults, setSupabaseResults] = useState<{
    articles?: { found: number; imported: number; skipped: number; errors: number };
    images?: { found: number; imported: number; skipped: number; errors: number };
    categories?: { found: number; imported: number; skipped: number };
    authors?: { found: number; imported: number; skipped: number };
  } | null>(null);

  // Supabase Image Migration states (server-side Firebase Admin)
  const [imageMigrationRunning, setImageMigrationRunning] = useState(false);
  const [imageMigrationProgress, setImageMigrationProgress] = useState({ current: 0, total: 0, message: '' });
  const [imageMigrationResults, setImageMigrationResults] = useState<{
    preview?: { totalArticles: number; supabaseImages: number; firebaseImages: number; noImage: number; needsMigration: number };
    results?: { total: number; migrated: number; skipped: number; errors: number; errorDetails: string[] };
  } | null>(null);

  // Status Fix Tool states
  const [statusFixRunning, setStatusFixRunning] = useState(false);
  const [statusFixResults, setStatusFixResults] = useState<{
    total?: number;
    statusCounts?: { published: number; draft: number; review: number; archived: number; other: number };
    otherStatuses?: Record<string, number>;
    visibleOnFrontend?: number;
    hiddenFromFrontend?: number;
    updated?: number;
    skipped?: number;
    errors?: number;
  } | null>(null);

  // Auto-Categorize Tool states
  const [categorizingArticles, setCategorizingArticles] = useState(false);
  const [categorizeResults, setCategorizeResults] = useState<{
    total?: number;
    currentDistribution?: Record<string, number>;
    proposedDistribution?: Record<string, number>;
    wouldChange?: number;
    updated?: number;
    unchanged?: number;
    errors?: number;
    remaining?: number;
  } | null>(null);

  // Assign Author Tool states
  const [assigningAuthor, setAssigningAuthor] = useState(false);
  const [authorToolData, setAuthorToolData] = useState<{
    users?: Array<{ id: string; displayName: string; email: string; photoURL?: string; role: string }>;
    authorDistribution?: Record<string, number>;
    importedAuthorCount?: number;
    totalArticles?: number;
    selectedUserId?: string;
    assignAll?: boolean;
    updated?: number;
    assignedTo?: { id: string; name: string; photoURL?: string };
  } | null>(null);

  // Agent Article Editor states
  const [agentArticle, setAgentArticle] = useState<Article | null>(null);
  const [agentTab, setAgentTab] = useState<'settings' | 'content' | 'media' | 'options' | 'prompt'>('settings');
  const articleLoadingRef = useRef<string | null>(null); // Track which article is being loaded
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Fact-check states
  const [factCheckResult, setFactCheckResult] = useState<{
    mode: 'quick' | 'detailed';
    status: 'passed' | 'review_recommended' | 'caution' | 'high_risk';
    summary: string;
    confidence: number;
    claims?: { text: string; status: string; explanation: string }[];
    recommendations?: string[];
    checkedAt: string;
  } | null>(null);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckMode, setFactCheckMode] = useState<'quick' | 'detailed'>('detailed');
  const [showFactCheckModeMenu, setShowFactCheckModeMenu] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);

  // Status Modal for AI generation progress
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalMessage, setStatusModalMessage] = useState('');
  const [statusModalIcon, setStatusModalIcon] = useState('🔍');

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // API Configuration state
  const [apiConfigTab, setApiConfigTab] = useState<'openai' | 'google' | 'perplexity' | 'elevenlabs' | 'weather' | 'payments' | 'claudecode'>('openai');

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

      // Auto-select current user ONLY for NEW articles that have no author set
      // This prevents overwriting author info when editing existing articles
      // A new article has either empty id ('') or temporary id (starts with 'art-')
      const isNewArticle = agentArticle?.id === '' || agentArticle?.id?.startsWith('art-');
      const isNewArticleWithoutAuthor = isNewArticle && !agentArticle.authorId && !agentArticle.author;
      if (agentArticle && isNewArticleWithoutAuthor && currentUser) {
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

  // Load agent prompt when switching to an agent tab
  useEffect(() => {
    const agentTabs: AgentType[] = ['MASTER', 'JOURNALIST', 'EDITOR', 'SEO', 'SOCIAL', 'GEO'];
    if (agentTabs.includes(activeTab as AgentType)) {
      getAgentPrompt(activeTab as AgentType).then(setCurrentAgentPrompt).catch(console.error);
    }
  }, [activeTab]);

  // Close fact-check mode menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFactCheckModeMenu && !target.closest('.fact-check-mode-selector')) {
        setShowFactCheckModeMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFactCheckModeMenu]);

  // Handle URL action params (e.g., ?action=new-article, ?action=edit-article&id=xxx)
  useEffect(() => {
    const action = searchParams.get('action');
    console.log('[Admin] Action handler effect running, action:', action);

    if (action === 'new-article' && currentUser) {
      // Create new article and open JOURNALIST tab
      // Default author to the logged-in user (can be changed via dropdown)
      const newArticle: Article = {
        id: `art-${Date.now()}`,
        title: '',
        slug: '',
        excerpt: '',
        category: 'News',
        author: currentUser?.displayName || userProfile?.displayName || 'Staff Writer',
        authorId: currentUser?.uid || '',
        authorPhotoURL: userProfile?.photoURL || '',
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
      const articlesSnapshot = await getDocs(collection(getDb(), 'articles'));
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
        const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
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
        const usersSnapshot = await getDocs(collection(getDb(), 'users'));
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
      await deleteDoc(doc(getDb(), 'articles', articleId));
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
      await updateDoc(doc(getDb(), 'articles', article.id), { status: newStatus });
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
      await setDoc(doc(getDb(), 'settings', 'config'), settings);

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

  // Supabase Import handlers
  const handleSupabasePreview = async () => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      toast.error('Please enter Supabase URL and API key');
      return;
    }

    setSupabaseImporting(true);
    setSupabaseProgress({ current: 0, total: 0, message: 'Connecting to Supabase...' });
    setSupabaseResults(null);

    try {
      const params = new URLSearchParams({
        supabaseUrl: supabaseConfig.url,
        supabaseKey: supabaseConfig.key,
      });
      if (supabaseConfig.dateFrom) params.set('dateFrom', supabaseConfig.dateFrom);
      if (supabaseConfig.dateTo) params.set('dateTo', supabaseConfig.dateTo);

      const response = await fetch(`/api/admin/supabase-import?${params.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}\n${data.details}` : data.error;
        throw new Error(errorMsg || 'Preview failed');
      }

      setSupabaseResults(data.preview);
      toast.success(`Found ${data.preview?.articles?.found || 0} articles to import`);
    } catch (error) {
      console.error('Supabase preview failed:', error);
      toast.error(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setSupabaseImporting(false);
      setSupabaseProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleSupabaseImport = async () => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      toast.error('Please enter Supabase URL and API key');
      return;
    }

    setSupabaseImporting(true);
    setSupabaseProgress({
      current: 0,
      total: 0,
      message: supabaseConfig.clearFirst ? 'Clearing existing articles...' : 'Starting import...'
    });
    setSupabaseResults(null);

    try {
      const response = await fetch('/api/admin/supabase-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseUrl: supabaseConfig.url,
          supabaseKey: supabaseConfig.key,
          dateFrom: supabaseConfig.dateFrom || undefined,
          dateTo: supabaseConfig.dateTo || undefined,
          importArticles: supabaseConfig.importArticles,
          importImages: supabaseConfig.importImages,
          importCategories: supabaseConfig.importCategories,
          importAuthors: supabaseConfig.importAuthors,
          clearFirst: supabaseConfig.clearFirst,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}\n${data.details}` : data.error;
        throw new Error(errorMsg || 'Import failed');
      }

      setSupabaseResults(data.results);
      const clearedMsg = data.results?.cleared ? `Cleared ${data.results.cleared.deleted} old articles. ` : '';
      toast.success(`${clearedMsg}Import complete! ${data.results?.articles?.imported || 0} articles imported`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Supabase import failed:', error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setSupabaseImporting(false);
      setSupabaseProgress({ current: 0, total: 0, message: '' });
    }
  };

  // Image Migration Handlers (Firebase Admin - server-side)
  const handleImageMigrationPreview = async () => {
    setImageMigrationRunning(true);
    setImageMigrationProgress({ current: 0, total: 0, message: 'Scanning articles for Supabase images...' });
    setImageMigrationResults(null);

    try {
      const response = await fetch('/api/admin/migrate-supabase-images');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Preview failed');
      }

      setImageMigrationResults({ preview: data.preview });
      toast.success(`Found ${data.preview?.needsMigration || 0} images to migrate from Supabase`);
    } catch (error) {
      console.error('Image migration preview failed:', error);
      toast.error(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setImageMigrationRunning(false);
      setImageMigrationProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleImageMigrationExecute = async (batchSize: number = 50) => {
    setImageMigrationRunning(true);
    setImageMigrationProgress({ current: 0, total: 0, message: 'Starting image migration...' });

    try {
      const response = await fetch('/api/admin/migrate-supabase-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Migration failed');
      }

      setImageMigrationResults({ results: data.results });
      setImageMigrationProgress({
        current: data.results?.migrated || 0,
        total: data.results?.total || 0,
        message: `Migrated ${data.results?.migrated || 0} images`
      });

      if (data.remaining > 0) {
        toast.success(`Batch complete! ${data.results?.migrated || 0} images migrated. ${data.remaining} remaining - run again to continue.`);
      } else {
        toast.success(`Migration complete! ${data.results?.migrated || 0} images migrated to Firebase Storage.`);
      }
    } catch (error) {
      console.error('Image migration failed:', error);
      toast.error(error instanceof Error ? error.message : 'Migration failed');
    } finally {
      setImageMigrationRunning(false);
    }
  };

  // Status Fix Tool Handlers
  const handleStatusCheck = async () => {
    setStatusFixRunning(true);
    setStatusFixResults(null);

    try {
      const response = await fetch('/api/admin/fix-article-status');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Status check failed');
      }

      setStatusFixResults(data);

      if (data.hiddenFromFrontend > 0) {
        toast.warning(`${data.hiddenFromFrontend} articles are NOT visible on the frontend (not published)`);
      } else {
        toast.success(`All ${data.total} articles are published and visible!`);
      }
    } catch (error) {
      console.error('Status check failed:', error);
      toast.error(error instanceof Error ? error.message : 'Status check failed');
    } finally {
      setStatusFixRunning(false);
    }
  };

  const handleStatusFix = async () => {
    setStatusFixRunning(true);

    try {
      const response = await fetch('/api/admin/fix-article-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus: 'published', updateAll: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Status fix failed');
      }

      setStatusFixResults(prev => ({
        ...prev,
        updated: data.updated,
        skipped: data.skipped,
        errors: data.errors,
      }));

      toast.success(`Updated ${data.updated} articles to "published" status!`);

      // Refresh the status check to show new counts
      await handleStatusCheck();
    } catch (error) {
      console.error('Status fix failed:', error);
      toast.error(error instanceof Error ? error.message : 'Status fix failed');
    } finally {
      setStatusFixRunning(false);
    }
  };

  // Auto-Categorize Tool Handlers
  const handleCategorizePreview = async () => {
    setCategorizingArticles(true);
    setCategorizeResults(null);

    try {
      const response = await fetch('/api/admin/auto-categorize');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Preview failed');
      }

      setCategorizeResults(data);
      toast.success(`Found ${data.wouldChange} articles that would be re-categorized`);
    } catch (error) {
      console.error('Categorize preview failed:', error);
      toast.error(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setCategorizingArticles(false);
    }
  };

  const handleCategorizeExecute = async () => {
    setCategorizingArticles(true);

    try {
      const response = await fetch('/api/admin/auto-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 200 }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Categorization failed');
      }

      setCategorizeResults(prev => ({
        ...prev,
        updated: data.updated,
        unchanged: data.unchanged,
        errors: data.errors,
        remaining: data.remaining,
      }));

      if (data.remaining > 0) {
        toast.success(`Categorized ${data.updated} articles. ${data.remaining} remaining - run again to continue.`);
      } else {
        toast.success(`Categorization complete! ${data.updated} articles updated.`);
      }

      // Refresh preview to show new distribution
      await handleCategorizePreview();
    } catch (error) {
      console.error('Categorization failed:', error);
      toast.error(error instanceof Error ? error.message : 'Categorization failed');
    } finally {
      setCategorizingArticles(false);
    }
  };

  // Assign Author Tool Handlers
  const handleLoadAuthorData = async () => {
    setAssigningAuthor(true);

    try {
      const response = await fetch('/api/admin/assign-author');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to load data');
      }

      setAuthorToolData({
        users: data.users,
        authorDistribution: data.authorDistribution,
        importedAuthorCount: data.importedAuthorCount,
        totalArticles: data.totalArticles,
      });

      if (data.importedAuthorCount > 0) {
        toast.info(`Found ${data.importedAuthorCount} articles with imported/unknown authors`);
      }
    } catch (error) {
      console.error('Failed to load author data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setAssigningAuthor(false);
    }
  };

  const handleAssignAuthor = async (assignAll: boolean = false) => {
    if (!authorToolData?.selectedUserId) {
      toast.error('Please select a user first');
      return;
    }

    setAssigningAuthor(true);

    try {
      const response = await fetch('/api/admin/assign-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authorToolData.selectedUserId,
          assignAll,
          onlyImported: !assignAll,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Assignment failed');
      }

      setAuthorToolData(prev => ({
        ...prev,
        updated: data.updated,
        assignedTo: data.assignedTo,
      }));

      toast.success(`Assigned ${data.updated} articles to ${data.assignedTo.name}`);

      // Refresh the data to show new distribution
      await handleLoadAuthorData();
    } catch (error) {
      console.error('Author assignment failed:', error);
      toast.error(error instanceof Error ? error.message : 'Assignment failed');
    } finally {
      setAssigningAuthor(false);
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
      case 'GEO': return <Globe size={16} className="mr-3 text-teal-600"/>;
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

      // Get prompt from Firestore (includes any customizations by partners)
      const agentType = activeTab as AgentType;
      const promptData = await getAgentPrompt(agentType);

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

  // Send a prompt directly (for tool buttons)
  const sendPromptToAi = async (prompt: string) => {
    if (!prompt.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: prompt };
    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const apiKey = settings?.geminiApiKey || '';
      if (!apiKey) {
        showMessage('error', 'Gemini API Key not configured. Go to API Configuration to set it.');
        setIsChatLoading(false);
        return;
      }

      // Get prompt from Firestore
      const agentType = activeTab as AgentType;
      const promptData = await getAgentPrompt(agentType);

      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: promptData.instruction }] }
        })
      });

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';

      // Try to parse JSON from the response
      try {
        // Extract JSON from markdown code blocks or plain text
        let jsonText = aiResponse;
        const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        } else {
          // Try to find JSON object in the text
          const objectMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            jsonText = objectMatch[0];
          }
        }

        const parsedJson = JSON.parse(jsonText);
        setAiGeneratedData(parsedJson);
        console.log('Parsed JSON data:', parsedJson);
      } catch (e) {
        // No valid JSON in response, that's okay
        setAiGeneratedData(null);
      }

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

  // Fact-check article
  const handleFactCheck = async (mode: 'quick' | 'detailed' = 'detailed') => {
    if (!agentArticle?.title || !agentArticle?.content) {
      showMessage('error', 'Article needs title and content to fact-check');
      return;
    }

    setIsFactChecking(true);
    setFactCheckResult(null);

    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          articleId: agentArticle.id || undefined,
          title: agentArticle.title,
          content: agentArticle.content,
          sourceTitle: agentArticle.sourceTitle,
          sourceSummary: agentArticle.description,
          sourceUrl: agentArticle.sourceUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fact-check failed');
      }

      const result = await response.json();
      setFactCheckResult(result);

      // Add fact-check cost to article
      if (result.cost) {
        const updatedCosts = addCost(
          agentArticle.generationCosts,
          'factCheck',
          result.cost
        );
        setAgentArticle({ ...agentArticle, generationCosts: updatedCosts });
        console.log(`[FactCheck] Added cost: ${formatCost(result.cost)} (Total: ${formatCost(updatedCosts.total)})`);
      }

      // Show success message based on confidence
      if (result.confidence >= 80) {
        showMessage('success', `Fact-check passed! Confidence: ${result.confidence}%`);
      } else if (result.confidence >= 60) {
        showMessage('warning', `Review recommended. Confidence: ${result.confidence}%`);
      } else {
        showMessage('error', `Caution! Low confidence: ${result.confidence}%`);
      }

    } catch (error) {
      console.error('[FactCheck] Error:', error);
      showMessage('error', error instanceof Error ? error.message : 'Fact-check failed');
    } finally {
      setIsFactChecking(false);
    }
  };

  // Regenerate featured image (try getting a different stock photo)
  const handleRegenerateImage = async () => {
    if (!agentArticle?.title) {
      showMessage('error', 'Need an article title to search for images');
      return;
    }

    setIsRegeneratingImage(true);
    try {
      const { extractPhotoKeywords, findStockPhoto } = await import('@/lib/stockPhotos');
      // Extract keywords from both title AND content for better relevance
      const keywords = extractPhotoKeywords(agentArticle.title, agentArticle.content, agentArticle.category);
      const pexelsApiKey = settings?.pexelsApiKey as string;

      console.log(`[Image] Regenerating stock photo with keywords: "${keywords}"`);
      const stockPhoto = await findStockPhoto(keywords, agentArticle.category, pexelsApiKey);

      if (stockPhoto) {
        console.log(`[Image] Found ${stockPhoto.source} photo by ${stockPhoto.photographer}`);

        // Update article with new image
        const updatedArticle = {
          ...agentArticle,
          imageUrl: stockPhoto.url,
          featuredImage: stockPhoto.url,
          imageAttribution: stockPhoto.attribution
        };

        // Track cost (stock photos are free)
        if (stockPhoto.cost !== undefined) {
          const updatedCosts = addCost(
            agentArticle.generationCosts,
            'stockPhotoSearch',
            stockPhoto.cost
          );
          updatedArticle.generationCosts = updatedCosts;
          console.log(`[Cost] Stock photo regeneration: ${formatCost(stockPhoto.cost)} (Total: ${formatCost(updatedCosts.total)})`);
        }

        setAgentArticle(updatedArticle);
        showMessage('success', `New stock photo from ${stockPhoto.source} by ${stockPhoto.photographer}`);
      } else {
        showMessage('warning', 'No stock photos found. Try the AI image generator instead.');
      }
    } catch (error) {
      console.error('[Image] Regeneration failed:', error);
      showMessage('error', 'Failed to regenerate image');
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Save agent article
  const handleSaveAgentArticle = async (showNotification = true, articleOverride?: Article) => {
    // Use the override article if provided, otherwise use agentArticle state
    const articleData = articleOverride || agentArticle;

    // DEBUG: Log what's in articleData when save is called
    console.log('[DEBUG] handleSaveAgentArticle - articleData SEO fields:', {
      metaDescription: articleData?.metaDescription,
      keywords: articleData?.keywords,
      hashtags: articleData?.hashtags,
      localKeywords: articleData?.localKeywords,
      source: articleOverride ? 'articleOverride' : 'agentArticle state',
    });

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
        // Preserve original author info - only use current user for NEW articles
        authorId: articleData.authorId || currentUser?.uid || '',
        authorPhotoURL: articleData.authorPhotoURL || currentUser?.photoURL || '',
        // Set breaking news timestamp when isBreakingNews is true
        breakingNewsTimestamp: articleData.isBreakingNews ? new Date().toISOString() : null,
        // SEO & Social Metadata - explicitly preserve these fields
        metaDescription: articleData.metaDescription || '',
        keywords: articleData.keywords || [],
        hashtags: articleData.hashtags || [],
        localKeywords: articleData.localKeywords || [],
        geoTags: articleData.geoTags || [],
        entities: articleData.entities || { people: [], organizations: [], locations: [], topics: [] },
        imageAltText: articleData.imageAltText || '',
        schema: articleData.schema || '',
      };

      // Save to Firestore
      console.log('[Save] Saving article with SEO:', {
        id: articleToSave.id,
        keywords: articleToSave.keywords,
        hashtags: articleToSave.hashtags,
        metaDescription: articleToSave.metaDescription?.substring(0, 50) + '...',
      });
      const articleRef = doc(getDb(), 'articles', articleToSave.id);
      await setDoc(articleRef, articleToSave);
      console.log('[Save] Article saved to Firestore successfully');

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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showMessage('error', `Failed to save article: ${errorMessage}`);
      console.error('Article save error:', err);
    }
  };

  // Update selected article with AI-generated changes
  const updateSelectedArticle = async (updates: Partial<Article>) => {
    if (!selectedArticleForAction) {
      showMessage('error', 'No article selected');
      return;
    }

    const article = articles.find(a => a.id === selectedArticleForAction);
    if (!article) {
      showMessage('error', 'Selected article not found');
      return;
    }

    try {
      // Merge updates with existing article
      const updatedArticle: Article = {
        ...article,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore
      const articleRef = doc(getDb(), 'articles', updatedArticle.id);
      await updateDoc(articleRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));

      showMessage('success', 'Article updated successfully');
      setChatHistory(prev => [...prev, {
        role: 'model',
        text: `✅ **Updated!** Changes applied to "${updatedArticle.title}"`
      }]);

      return updatedArticle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showMessage('error', `Failed to update article: ${errorMessage}`);
      console.error('Article update error:', err);
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

      /*
       * IMAGE GENERATION FALLBACK SYSTEM
       * ================================
       *
       * Why this exists:
       * - OpenAI's DALL-E has a safety filter that blocks images for sensitive news topics
       *   (protests, violence, political figures, crime, ICE/immigration, etc.)
       * - News articles frequently cover these topics, so we need a fallback
       *
       * How it works:
       * 1. First tries to generate an image specific to the article title
       * 2. If DALL-E's safety filter rejects it, falls back to a category-appropriate generic image
       *
       * Why NO PEOPLE in fallbacks:
       * - DALL-E has known bias issues when depicting people (race, gender, religion stereotypes)
       * - Example: When asked for "classroom" it generated people in hijabs inappropriately
       * - Using scenery/objects only avoids these bias issues entirely
       *
       * Image variation:
       * - DALL-E 3 generates unique images each time, even with identical prompts
       * - We add random lighting/weather variations to increase diversity further
       */

      const specificPrompt = `A photorealistic news photograph depicting: ${agentArticle.title}. Professional editorial photography style, high resolution, natural lighting, clean composition without any text overlay or watermarks.`;

      // Random variations for more diverse fallback images
      const timeVariations = ['at dawn', 'at golden hour', 'at sunset', 'at dusk', 'in morning light', 'in afternoon light'];
      const weatherVariations = ['on a clear day', 'with dramatic clouds', 'with soft overcast sky', 'with blue sky'];
      const randomTime = timeVariations[Math.floor(Math.random() * timeVariations.length)];
      const randomWeather = weatherVariations[Math.floor(Math.random() * weatherVariations.length)];

      // Generic fallback prompts by category - NO PEOPLE to avoid AI bias issues
      const categoryFallbacks: Record<string, string> = {
        'News': `A photorealistic image of stacked newspapers and a coffee cup on a wooden desk ${randomTime}, no people, editorial style`,
        'Politics': `A photorealistic image of the US Capitol building dome ${randomTime} ${randomWeather}, no people, architectural photography`,
        'Sports': `A photorealistic image of an empty stadium ${randomTime}, dramatic lighting, no people`,
        'Business': `A photorealistic image of a modern glass skyscraper ${randomTime} ${randomWeather}, no people, architectural`,
        'Entertainment': `A photorealistic image of an empty theater with red velvet seats and stage lights, cinematic lighting, no people`,
        'Lifestyle': `A photorealistic image of a steaming coffee cup on a cafe table by a window ${randomTime}, cozy atmosphere, no people`,
        'Outdoors': `A photorealistic landscape of Blue Ridge Mountains ${randomTime} with morning mist, no people, nature photography`,
        'default': `A photorealistic landscape of Western North Carolina mountains ${randomTime} ${randomWeather}, no people, scenic`
      };

      const generateWithPrompt = async (prompt: string): Promise<{success: boolean; url?: string; error?: string}> => {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt.substring(0, 1000),
            n: 1,
            size: settings?.dalleSize || '1792x1024',
            quality: settings?.dalleQuality || 'standard',
            style: settings?.dalleStyle || 'natural'
          })
        });
        const data = await response.json();
        if (data.data?.[0]?.url) {
          return { success: true, url: data.data[0].url };
        }
        return { success: false, error: data.error?.message || 'Unknown error' };
      };

      console.log('[Image Gen] Trying specific prompt...');
      let result = await generateWithPrompt(specificPrompt);

      // If safety-rejected, try generic fallback
      if (!result.success && result.error?.toLowerCase().includes('safety')) {
        const category = agentArticle.category || 'default';
        const fallbackPrompt = categoryFallbacks[category] || categoryFallbacks['default'];
        console.log('[Image Gen] Safety rejected, trying fallback for category:', category);
        setChatHistory(prev => [...prev, { role: 'model', text: `⚠️ Content filter triggered. Generating category-appropriate image instead...` }]);
        result = await generateWithPrompt(fallbackPrompt);
      }

      if (result.success && result.url) {
        setChatHistory(prev => [...prev, { role: 'model', text: `🖼️ **Image Generated!** Saving to permanent storage...` }]);
        const permanentUrl = await storageService.uploadAssetFromUrl(result.url);
        setAgentArticle({ ...agentArticle, imageUrl: permanentUrl, featuredImage: permanentUrl });
        setChatHistory(prev => [...prev, { role: 'model', text: `✅ **Image Saved!** Your featured image has been permanently stored.` }]);
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('[Image Gen] Failed:', errorMessage);
      setChatHistory(prev => [...prev, { role: 'model', text: `❌ Image generation failed: ${errorMessage}` }]);
      showMessage('error', `Failed: ${errorMessage.substring(0, 100)}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Generate SEO metadata (meta description, image alt text, hashtags)
  const handleGenerateMetadata = async (types: ('metaDescription' | 'imageAltText' | 'hashtags')[]) => {
    if (!agentArticle?.title || !agentArticle?.content) {
      showMessage('error', 'Please enter article title and content first');
      return;
    }

    setIsGeneratingMetadata(true);
    setChatHistory(prev => [...prev, { role: 'user', text: `🏷️ Generate ${types.join(', ')} for article...` }]);

    try {
      const response = await fetch('/api/articles/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: agentArticle.title,
          content: agentArticle.content,
          category: agentArticle.category,
          imageUrl: agentArticle.imageUrl,
          generateTypes: types,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate metadata');
      }

      // Update article with generated metadata
      const updates: Partial<Article> = {};
      if (data.metadata.metaDescription) {
        updates.metaDescription = data.metadata.metaDescription;
      }
      if (data.metadata.imageAltText) {
        updates.imageAltText = data.metadata.imageAltText;
      }
      if (data.metadata.hashtags) {
        updates.hashtags = data.metadata.hashtags;
      }

      setAgentArticle({ ...agentArticle, ...updates });

      const generatedItems = Object.keys(data.metadata).filter(k => data.metadata[k]);
      setChatHistory(prev => [...prev, {
        role: 'model',
        text: `✅ **Metadata Generated!** Created: ${generatedItems.join(', ')}`
      }]);
      showMessage('success', 'Metadata generated successfully');
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('[Metadata Gen] Failed:', errorMessage);
      setChatHistory(prev => [...prev, { role: 'model', text: `❌ Metadata generation failed: ${errorMessage}` }]);
      showMessage('error', `Failed: ${errorMessage.substring(0, 100)}`);
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  // Submit article for review (Draft -> Review)
  const handleSubmitForReview = async () => {
    if (!selectedArticleForAction) return;

    const article = articles.find(a => a.id === selectedArticleForAction);
    if (!article) return;

    try {
      const updatedArticle = { ...article, status: 'review' as const, updatedAt: new Date().toISOString() };
      await updateDoc(doc(getDb(), 'articles', article.id), { status: 'review', updatedAt: new Date().toISOString() });
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
      await updateDoc(doc(getDb(), 'articles', article.id), { status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
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

      // OPTIONAL: Web search with Perplexity (if enabled)
      let webSearchResults: PerplexitySearchResult | undefined;
      if (settings?.usePerplexityForManualCreation && settings?.perplexityApiKey) {
        try {
          setStatusModalIcon('🌐');
          setStatusModalMessage('Searching web for current information...');

          const searchQuery = `Latest information about: ${suggestion.title}`;
          webSearchResults = await searchWithPerplexity(
            searchQuery,
            suggestion.summary,
            settings.perplexityApiKey
          );

          console.log('[Manual Article] Web search completed - confidence:', webSearchResults.confidence);
          setChatHistory(prev => [...prev, {
            role: 'model',
            text: `✅ **Web search completed** (confidence: ${webSearchResults.confidence}%)`
          }]);
        } catch (error) {
          console.error('[Manual Article] Web search failed:', error);
          setChatHistory(prev => [...prev, {
            role: 'model',
            text: '⚠️ **Web search failed** - proceeding with basic information only'
          }]);
        }
      }

      // Simulate research phase
      await new Promise(resolve => setTimeout(resolve, 500));
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
${webSearchResults ? `
VERIFIED WEB SEARCH RESULTS (Real-time information):
${webSearchResults.answer}
${webSearchResults.sources?.length ? `
Sources: ${webSearchResults.sources.join(', ')}
` : ''}
` : ''}
MANDATORY ANTI-FABRICATION PROTOCOL:

You MUST follow these HARD CONSTRAINTS (violations will be flagged):

1. FACTUAL BASIS ONLY:
   - Write ONLY what is directly supported by the Title, Summary, Angle${webSearchResults ? ', and VERIFIED WEB SEARCH RESULTS' : ''} provided above
   - Do NOT add specific names of people, organizations, or places unless they are in the source material${webSearchResults ? ' or web search results' : ''}
   - Do NOT invent statistics, dates, times, or specific details
   - Do NOT create or paraphrase quotes from anyone
   - If the source material is vague, your article must also be general${webSearchResults ? ' (but you may use verified web information to add context)' : ''}

2. STRICTLY PROHIBITED:
   - ❌ Creating quotes or statements attributed to people
   - ❌ Adding names not in source (no "John Smith said" or "according to Jane Doe")
   - ❌ Adding job titles or positions not in source
   - ❌ Inventing statistics, numbers, or data points
   - ❌ Making predictions or speculation beyond what's implied in the angle
   - ❌ Adding background information not derivable from the source

3. WHEN INFORMATION IS MISSING:
   - Use general phrasing: "Community members expressed concerns..."
   - Use passive voice: "The project has been proposed..."
   - Acknowledge gaps: "Specific details were not provided"
   - It is BETTER to be brief and factual than long and speculative

4. ARTICLE LENGTH:
   - Write 300-500 words maximum
   - Quality over quantity - do not pad with unsupported content
   - If source is brief, article should be brief

5. TONE AND STYLE:
   - AP style, professional journalism tone
   - Strong lede paragraph summarizing the angle
   - Context and background (only if derivable from source)
   - Forward-looking or community impact closing

CRITICAL FORMATTING REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. Each paragraph MUST be wrapped in its own <p></p> tags
2. Use <h2></h2> for section subheadings (sparingly)
3. Use <strong></strong> for emphasis on key terms only
4. NEVER put the entire article in a single <p> tag - break it into multiple paragraphs
5. Each new thought or topic should be a separate <p> paragraph
6. Do NOT include the article title
7. Do NOT use markdown formatting
8. Return ONLY valid HTML tags, nothing else

Example structure:
<p>First paragraph with the lede...</p>
<p>Second paragraph with context...</p>
<p>Third paragraph with implications...</p>
<p>Closing paragraph...</p>`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.1,  // LOWERED from default for more factual output
            topP: 0.8,         // Limit token sampling diversity
            topK: 20,          // Further constrain output choices
          },
          systemInstruction: {
            parts: [{
              text: "You are a factual news writing assistant. You NEVER fabricate information. You ONLY write about facts explicitly stated in provided sources. You NEVER create quotes, names, or specific details not in the source. If information is missing, you acknowledge gaps rather than inventing details. Accuracy is more important than article length. You follow AP style guidelines strictly."
            }]
          }
        })
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

      // Initialize cost tracking
      let articleCosts = { total: 0, breakdown: {}, lastUpdated: new Date().toISOString() };

      // Track article generation cost
      articleCosts = addCost(articleCosts, 'articleGeneration', API_PRICING.GEMINI_ARTICLE_GENERATION);
      console.log(`[Cost] Article generation: ${formatCost(API_PRICING.GEMINI_ARTICLE_GENERATION)}`);

      // Track Perplexity web search cost (if used)
      if (webSearchResults) {
        articleCosts = addCost(articleCosts, 'other', API_PRICING.PERPLEXITY_SEARCH, 'Perplexity Web Search');
        console.log(`[Cost] Perplexity web search: ${formatCost(API_PRICING.PERPLEXITY_SEARCH)}`);
      }

      // MANDATORY FACT-CHECK before proceeding
      setStatusModalIcon('🔍');
      setStatusModalMessage('Running fact-check analysis...');

      let factCheckResult = null;
      try {
        const factCheckResponse = await fetch('/api/fact-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'quick',
            title: suggestion.title,
            content: content,
            sourceTitle: suggestion.title,
            sourceSummary: suggestion.summary,
            sourceUrl: '', // No source URL for manual creation
          }),
        });

        if (factCheckResponse.ok) {
          factCheckResult = await factCheckResponse.json();
          console.log(`[Fact-check] Status: ${factCheckResult.status}, Confidence: ${factCheckResult.confidence}%`);

          // Track fact-check cost
          articleCosts = addCost(articleCosts, 'factCheck', API_PRICING.GEMINI_FACT_CHECK_QUICK);

          // CRITICAL: Block high-risk articles
          if (factCheckResult.status === 'high_risk') {
            setShowStatusModal(false);
            setChatHistory(prev => [
              ...prev,
              { role: 'model', text: `❌ **Article Blocked - High Risk**\n\n**Fact-Check Summary:**\n${factCheckResult.summary}\n\n**Confidence:** ${factCheckResult.confidence}%\n\n**Action Required:** This article contains potentially fabricated information and cannot be created. Please provide more specific source material or revise the topic.` }
            ]);
            throw new Error(`Article blocked due to high-risk fact-check: ${factCheckResult.summary}`);
          }

          // Warn about caution/review_recommended
          if (factCheckResult.status === 'caution' || factCheckResult.status === 'review_recommended') {
            setChatHistory(prev => [
              ...prev,
              { role: 'model', text: `⚠️ **Fact-Check Warning**\n\n${factCheckResult.summary}\n\n**Confidence:** ${factCheckResult.confidence}%\n\nArticle will be created as DRAFT for manual review before publication.` }
            ]);
          } else if (factCheckResult.status === 'passed') {
            setChatHistory(prev => [
              ...prev,
              { role: 'model', text: `✅ **Fact-Check Passed** (Confidence: ${factCheckResult.confidence}%)` }
            ]);
          }
        } else {
          console.error('[Fact-check] API call failed - proceeding with caution');
          setChatHistory(prev => [
            ...prev,
            { role: 'model', text: `⚠️ **Fact-check unavailable** - article will be created as DRAFT for manual review.` }
          ]);
        }
      } catch (fcError) {
        console.error('[Fact-check] Error:', fcError);
        // If fact-check throws (high_risk block), re-throw to stop article creation
        if (fcError instanceof Error && fcError.message.includes('high-risk')) {
          throw fcError;
        }
        // Otherwise log warning and continue
        setChatHistory(prev => [
          ...prev,
          { role: 'model', text: `⚠️ **Fact-check error** - article will be created as DRAFT for manual review.` }
        ]);
      }

      // Update status to image generation
      setStatusModalIcon('🖼️');
      setStatusModalMessage('Searching for stock photos...');

      // Try to get article image using hybrid strategy (stock photos first, then AI)
      let imageUrl = '';
      let imageAttribution = '';

      try {
        // STEP 1: Try stock photos first (Unsplash → Pexels)
        const { extractPhotoKeywords, findStockPhoto } = await import('@/lib/stockPhotos');
        // Extract keywords from both title AND content for better relevance
        const keywords = extractPhotoKeywords(suggestion.title, content, undefined);

        const pexelsApiKey = settings?.pexelsApiKey as string;
        console.log(`[Image] Searching with keywords: "${keywords}"`);
        const stockPhoto = await findStockPhoto(keywords, undefined, pexelsApiKey);

        if (stockPhoto) {
          console.log(`[Image] Using ${stockPhoto.source} photo by ${stockPhoto.photographer}`);
          setStatusModalMessage(`Found ${stockPhoto.source} photo by ${stockPhoto.photographer}...`);

          // Persist stock photo to Firebase Storage
          imageUrl = await storageService.uploadAssetFromUrl(stockPhoto.url);
          imageAttribution = stockPhoto.attribution;

          // Track stock photo cost ($0 for free tier)
          articleCosts = addCost(articleCosts, 'stockPhotoSearch', stockPhoto.cost);
          console.log(`[Cost] Stock photo: ${formatCost(stockPhoto.cost)}`);
        }
      } catch (error) {
        console.error('[Image] Stock photo search failed:', error);
      }

      // STEP 2: Fall back to AI generation if no stock photos found
      if (!imageUrl && settings?.openaiApiKey) {
        try {
          setStatusModalMessage('No stock photos found, generating with AI...');

          // Extract visual elements from content for better image generation
          let visualElements: string | null = null;
          if (settings?.geminiApiKey && content) {
            const { extractVisualElements } = await import('@/lib/imageGeneration');
            visualElements = await extractVisualElements(suggestion.title, content, categoryName, settings.geminiApiKey as string);
            if (visualElements) {
              console.log(`[Image] Visual elements extracted: ${visualElements}`);
              // Track visual extraction cost
              articleCosts = addCost(articleCosts, 'visualExtraction', API_PRICING.GEMINI_VISUAL_EXTRACTION);
              console.log(`[Cost] Visual extraction: ${formatCost(API_PRICING.GEMINI_VISUAL_EXTRACTION)}`);
            }
          }

          // Build detailed prompt with AP-style guidelines
          const { buildDetailedImagePrompt } = await import('@/lib/imageGeneration');
          const imagePrompt = buildDetailedImagePrompt(suggestion.title, visualElements || undefined, categoryName);

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
              quality: settings?.dalleQuality || 'hd',
              style: settings?.dalleStyle || 'natural'
            })
          });

          const imageData = await imageResponse.json();
          const tempImageUrl = imageData.data?.[0]?.url || '';

          // Persist AI image to Firebase Storage before it expires
          if (tempImageUrl) {
            setStatusModalMessage('Saving AI-generated image to permanent storage...');
            imageUrl = await storageService.uploadAssetFromUrl(tempImageUrl);
            imageAttribution = 'AI-generated image';

            // Track AI image generation cost
            const imageQuality = settings?.dalleQuality || 'hd';
            const imageCost = imageQuality === 'hd' ? API_PRICING.DALLE_3_HD : API_PRICING.DALLE_3_STANDARD;
            articleCosts = addCost(articleCosts, 'imageGeneration', imageCost);
            console.log(`[Cost] AI image (${imageQuality}): ${formatCost(imageCost)}`);
          }
        } catch (error) {
          console.error('[Image] AI image generation failed:', error);
          // Continue without image
        }
      }

      // Generate SEO metadata
      setStatusModalIcon('🔍');
      setStatusModalMessage('Generating SEO metadata...');

      let seoMetadata: {
        metaDescription?: string;
        keywords?: string[];
        hashtags?: string[];
        localKeywords?: string[];
        geoTags?: string[];
        entities?: { people: string[]; organizations: string[]; locations: string[]; topics: string[] };
        imageAltText?: string;
        schema?: string;
      } = {};

      try {
        console.log('[SEO] Calling generate-metadata API...');
        const seoResponse = await fetch('/api/articles/generate-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: suggestion.title,
            content,
            category: categoryName,
            authorName: currentUser?.displayName || 'Staff Writer',
            generateTypes: ['all'],
          }),
        });

        if (seoResponse.ok) {
          const seoData = await seoResponse.json();
          seoMetadata = seoData.metadata || {};
          console.log('[SEO] Generated:', seoMetadata.keywords?.length || 0, 'keywords,', seoMetadata.hashtags?.length || 0, 'hashtags');
          console.log('[SEO] Full metadata:', JSON.stringify(seoMetadata, null, 2));

          // Track SEO generation cost
          articleCosts = addCost(articleCosts, 'other', 0.001, 'SEO Metadata Generation');
        } else {
          const errorText = await seoResponse.text();
          console.error('[SEO] Failed to generate metadata. Status:', seoResponse.status, 'Error:', errorText);
        }
      } catch (seoError) {
        console.error('[SEO] Error:', seoError);
      }

      // Ensure SEO fields have default values if generation failed
      const titleWords = suggestion.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length > 3);
      if (!seoMetadata.metaDescription) {
        seoMetadata.metaDescription = `${suggestion.title} - Read the latest ${categoryName} news from Western North Carolina.`.substring(0, 155);
      }
      if (!seoMetadata.keywords || seoMetadata.keywords.length === 0) {
        seoMetadata.keywords = [...new Set([categoryName.toLowerCase(), ...titleWords])].slice(0, 8);
      }
      if (!seoMetadata.hashtags || seoMetadata.hashtags.length === 0) {
        seoMetadata.hashtags = seoMetadata.keywords.slice(0, 5).map(k => `#${k.replace(/\s+/g, '')}`);
      }
      if (!seoMetadata.localKeywords) {
        seoMetadata.localKeywords = ['Western North Carolina', 'WNC', 'Asheville area'];
      }
      if (!seoMetadata.geoTags) {
        seoMetadata.geoTags = ['Western North Carolina'];
      }
      if (!seoMetadata.entities) {
        seoMetadata.entities = { people: [], organizations: [], locations: [], topics: [categoryName] };
      }
      if (!seoMetadata.imageAltText) {
        seoMetadata.imageAltText = `${categoryName} news from Western North Carolina`;
      }
      console.log('[SEO] Final metadata (with defaults):', seoMetadata.keywords?.length, 'keywords,', seoMetadata.hashtags?.length, 'hashtags');

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
        imageAttribution,
        isFeatured: false,
        isBreakingNews: false,
        generationCosts: articleCosts,
        // Fact-check results
        factCheckStatus: factCheckResult?.status,
        factCheckSummary: factCheckResult?.summary,
        factCheckConfidence: factCheckResult?.confidence,
        factCheckedAt: factCheckResult ? new Date().toISOString() : null,
        // SEO & Social Metadata (auto-generated)
        metaDescription: seoMetadata.metaDescription,
        keywords: seoMetadata.keywords,
        hashtags: seoMetadata.hashtags,
        localKeywords: seoMetadata.localKeywords,
        geoTags: seoMetadata.geoTags,
        entities: seoMetadata.entities,
        imageAltText: seoMetadata.imageAltText,
        schema: seoMetadata.schema,
      };

      // Log total article generation cost
      console.log(`[Cost] Total article cost: ${formatCost(articleCosts.total)}`);
      console.log(`[Cost] Breakdown:`, articleCosts.breakdown);

      // DEBUG: Log article SEO fields before setting state
      console.log('[DEBUG] newArticle SEO fields:', {
        metaDescription: newArticle.metaDescription,
        keywords: newArticle.keywords,
        hashtags: newArticle.hashtags,
        localKeywords: newArticle.localKeywords,
        geoTags: newArticle.geoTags,
        imageAltText: newArticle.imageAltText,
      });

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
      await setDoc(doc(getDb(), 'settings', 'config'), { ...settings, customRolePermissions }, { merge: true });
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
                    authorId: currentUser?.uid || '',
                    authorPhotoURL: userProfile?.photoURL || currentUser?.photoURL || '',
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

      {/* Google Analytics Widget */}
      <GoogleAnalyticsWidget />

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

      {/* Quick Link to Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench size={20} className="text-amber-600" />
            Tools & Utilities
          </CardTitle>
          <CardDescription>Database cleanup, migration, and import utilities</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setActiveTab('tools')}
            className="w-full justify-start"
          >
            <ArrowRight size={16} className="mr-2" />
            Open Tools Section
          </Button>
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
          {settings.brandingMode === 'logo' && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="darkModeLogoUrl">Dark Mode Logo (Optional)</Label>
              <div className="flex items-start gap-3">
                <Input
                  id="darkModeLogoUrl"
                  value={settings.darkModeLogoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, darkModeLogoUrl: e.target.value })}
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
                        setUploadingDarkModeLogo(true);
                        try {
                          const url = await storageService.uploadLogo(file);
                          setSettings({ ...settings, darkModeLogoUrl: url });
                          setMessage({ type: 'success', text: 'Dark mode logo uploaded successfully!' });
                        } catch (err) {
                          setMessage({ type: 'error', text: 'Failed to upload dark mode logo' });
                        } finally {
                          setUploadingDarkModeLogo(false);
                        }
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingDarkModeLogo} asChild>
                    <span>{uploadingDarkModeLogo ? 'Uploading...' : 'Upload'}</span>
                  </Button>
                </label>
                {settings.darkModeLogoUrl && (
                  <>
                    <div className="w-[150px] h-[50px] border rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
                      <img src={settings.darkModeLogoUrl} alt="Dark Mode Logo Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSettings({ ...settings, darkModeLogoUrl: '' })}
                      className="text-destructive"
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Optional: Upload a logo optimized for dark mode. If not set, the primary logo will be used.
              </p>
            </div>
          )}
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
      <Tabs value={apiConfigTab} onValueChange={(v) => setApiConfigTab(v as 'openai' | 'google' | 'perplexity' | 'elevenlabs' | 'weather' | 'payments' | 'claudecode')} className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-2">
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <Sparkles size={16} /> OpenAI
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Sparkles size={16} /> Google AI
          </TabsTrigger>
          <TabsTrigger value="claudecode" className="flex items-center gap-2">
            <Code size={16} /> Claude Code
          </TabsTrigger>
          <TabsTrigger value="perplexity" className="flex items-center gap-2">
            <Search size={16} /> Perplexity
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

              {/* Stock Photo APIs */}
              <Card className="bg-green-50/50 border-green-200 mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-900">
                    <ImageIcon size={18} /> Stock Photo Integration
                  </CardTitle>
                  <CardDescription>
                    Use free stock photos from Pexels before falling back to AI generation. Reduces costs and provides real photography.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pexelsKey">Pexels API Key (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="pexelsKey"
                        type="password"
                        value={settings.pexelsApiKey || ''}
                        onChange={(e) => {
                          setSettings({ ...settings, pexelsApiKey: e.target.value });
                        }}
                        placeholder="Enter Pexels API key..."
                        className="font-mono flex-1"
                      />
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          if (!settings.pexelsApiKey) {
                            showMessage('error', 'Please enter an API key first');
                            return;
                          }
                          try {
                            const response = await fetch('https://api.pexels.com/v1/search?query=news&per_page=1', {
                              headers: { 'Authorization': settings.pexelsApiKey }
                            });
                            if (response.ok) {
                              showMessage('success', 'API Key Valid! Pexels stock photos are ready.');
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
                      Free tier: 200 requests/hour. <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get your API key here</a>
                    </p>
                  </div>

                  <div className="bg-white/50 border border-green-300 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-green-900 mb-2">💡 Hybrid Image Strategy</h4>
                    <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                      <li><strong>Step 1:</strong> Try Pexels stock photos (free, real photography)</li>
                      <li><strong>Step 2:</strong> Fall back to DALL-E AI generation if no match</li>
                      <li><strong>Savings:</strong> ~80% cost reduction on images with stock photos</li>
                    </ul>
                  </div>
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

        {/* Claude Code API Tab */}
        <TabsContent value="claudecode" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Code className="text-purple-700" size={24} />
                </div>
                <div>
                  <CardTitle>Claude Code API (Anthropic)</CardTitle>
                  <CardDescription>
                    Powers advanced coding assistance, content generation, and AI-driven features.{' '}
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Get your API key here
                    </a>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="claudeCodeKey">Claude Code API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="claudeCodeKey"
                    type="password"
                    value={settings.claudeCodeApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, claudeCodeApiKey: e.target.value })}
                    placeholder="sk-ant-api..."
                    className="font-mono flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!settings.claudeCodeApiKey) {
                        showMessage('error', 'Please enter an API key first');
                        return;
                      }
                      try {
                        const response = await fetch('/api/admin/test-claude', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            apiKey: settings.claudeCodeApiKey
                          })
                        });
                        const data = await response.json();
                        if (response.ok) {
                          showMessage('success', data.message || 'API Key Valid! Claude Code services are ready.');
                        } else {
                          // Show detailed error with model information if available
                          let errorMsg = `${data.error || 'API Key Invalid'}: ${data.details || 'Please check your key'}`;
                          if (data.fullError) {
                            console.log('[Claude Test] Full error details:', data.fullError);
                          }
                          showMessage('error', errorMsg);
                        }
                      } catch (error: any) {
                        showMessage('error', `API Key Test Failed: ${error.message}`);
                      }
                    }}
                  >
                    Test Key
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optional. Enables Claude Code features for advanced content generation and coding assistance.
                </p>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${settings.claudeCodeApiKey ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <Badge variant={settings.claudeCodeApiKey ? 'default' : 'secondary'} className={settings.claudeCodeApiKey ? 'bg-green-600' : 'bg-amber-600'}>
                  {settings.claudeCodeApiKey ? 'Configured' : 'Not Configured'}
                </Badge>
                <span className={`text-sm ${settings.claudeCodeApiKey ? 'text-green-700' : 'text-amber-700'}`}>
                  {settings.claudeCodeApiKey ? 'Claude Code features enabled' : 'Claude Code features disabled'}
                </span>
              </div>

              {/* Feature Info */}
              <Card className="bg-purple-50/50 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-purple-900">
                    <Sparkles size={18} /> Claude Code Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span><strong>Advanced Content Generation:</strong> Create high-quality, nuanced articles with Claude's reasoning capabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span><strong>Code Assistance:</strong> Generate and optimize code snippets, templates, and integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span><strong>Long-form Writing:</strong> Extended context window supports comprehensive articles and research</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span><strong>Multi-turn Conversations:</strong> Enhanced chat assistant with better context retention</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Available Models Info */}
              <Card className="bg-blue-50/50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-900">Available Models</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                    <li><strong>Claude 3.5 Sonnet:</strong> Best balance of intelligence and speed</li>
                    <li><strong>Claude 3 Opus:</strong> Most powerful for complex tasks</li>
                    <li><strong>Claude 3 Haiku:</strong> Fastest and most cost-effective</li>
                    <li><strong>Context Window:</strong> 200K tokens (approximately 150,000 words)</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perplexity Tab */}
        <TabsContent value="perplexity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Search className="text-indigo-700" size={24} />
                </div>
                <div>
                  <CardTitle>Perplexity AI (Web Search)</CardTitle>
                  <CardDescription>
                    Powers real-time web search for article fact-checking and current information.{' '}
                    <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Get your API key here
                    </a>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="perplexityKey">Perplexity API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="perplexityKey"
                    type="password"
                    value={settings.perplexityApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, perplexityApiKey: e.target.value })}
                    placeholder="pplx-..."
                    className="font-mono flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!settings.perplexityApiKey) {
                        showMessage('error', 'Please enter an API key first');
                        return;
                      }
                      try {
                        const response = await fetch('/api/admin/test-perplexity', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            apiKey: settings.perplexityApiKey
                          })
                        });
                        const data = await response.json();
                        if (response.ok) {
                          showMessage('success', data.message || 'API Key Valid! Perplexity web search is ready.');
                        } else {
                          // Show detailed error with model information if available
                          let errorMsg = `${data.error || 'API Key Invalid'}: ${data.details || 'Please check your key'}`;
                          if (data.fullError) {
                            console.log('[Perplexity Test] Full error details:', data.fullError);
                          }
                          showMessage('error', errorMsg);
                        }
                      } catch (error: any) {
                        showMessage('error', `API Key Test Failed: ${error.message}`);
                      }
                    }}
                  >
                    Test Key
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optional but recommended for A/B testing article quality improvements.
                </p>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${settings.perplexityApiKey ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <Badge variant={settings.perplexityApiKey ? 'default' : 'secondary'} className={settings.perplexityApiKey ? 'bg-green-600' : 'bg-amber-600'}>
                  {settings.perplexityApiKey ? 'Configured' : 'Not Configured'}
                </Badge>
                <span className={`text-sm ${settings.perplexityApiKey ? 'text-green-700' : 'text-amber-700'}`}>
                  {settings.perplexityApiKey ? 'Web search enabled for A/B testing' : 'Web search disabled'}
                </span>
              </div>

              {/* Feature Info */}
              <Card className="bg-indigo-50/50 border-indigo-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-indigo-900">
                    <Sparkles size={18} /> Article Quality Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-indigo-700 mb-3">
                    Enable Perplexity web search on individual AI journalists to test article quality improvements:
                  </p>
                  <ul className="space-y-2 text-sm text-indigo-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span><strong>Real-time information:</strong> Fetch current job titles, organizations, and facts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span><strong>Reduce hallucinations:</strong> Verify claims against live web data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span><strong>Source citations:</strong> Include verifiable sources in articles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span><strong>A/B testing:</strong> Compare Gemini-only vs Perplexity+Gemini article quality</span>
                    </li>
                  </ul>
                  <p className="text-xs text-indigo-600 mt-3">
                    💡 Configure per-journalist in AI Journalists → Edit → Article Generation Features
                  </p>
                </CardContent>
              </Card>

              {/* Manual Article Creation Setting */}
              {settings.perplexityApiKey && (
                <Card className="bg-blue-50/50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                      <Wand2 size={18} /> Manual Article Creation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="usePerplexityManual"
                        checked={settings.usePerplexityForManualCreation || false}
                        onChange={(e) => setSettings({ ...settings, usePerplexityForManualCreation: e.target.checked })}
                        className="mt-1 w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="usePerplexityManual" className="font-medium text-sm text-blue-900 cursor-pointer">
                          Use Web Search for Manual Articles
                        </label>
                        <p className="text-sm text-blue-700 mt-1">
                          When enabled, manually created articles (via Admin → Create Article) will query Perplexity
                          for real-time web verification before generating content. This helps reduce fabrication and
                          provides more current, factual information.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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

              {/* Admin Chat Voice Configuration */}
              {settings.elevenLabsApiKey && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="text-purple-600" size={20} />
                      <CardTitle className="text-base">Admin Chat Assistant Voice</CardTitle>
                    </div>
                    <CardDescription>Configure a separate voice for the admin chat assistant (optional)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Admin Chat Voice Preset</Label>
                      <select
                        value={settings.adminChatVoice?.voiceId || ''}
                        onChange={(e) => {
                          const voiceId = e.target.value;
                          const voiceName = e.target.options[e.target.selectedIndex].text;
                          if (!voiceId) {
                            // Clear admin chat voice - will use global settings
                            const { adminChatVoice, ...rest } = settings;
                            setSettings(rest);
                          } else {
                            setSettings({
                              ...settings,
                              adminChatVoice: {
                                ...settings.adminChatVoice,
                                voiceId,
                                voiceName,
                              }
                            });
                          }
                        }}
                        className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
                      >
                        <option value="">Use Global Voice Settings</option>
                        <option value="21m00Tcm4TlvDq8ikWAM">Rachel - News Anchor (Professional, clear)</option>
                        <option value="pNInz6obpgDQGcFmaJgB">Adam - Authoritative (Deep, confident)</option>
                        <option value="EXAVITQu4vr4xnSDxMaL">Bella - Friendly (Warm, conversational)</option>
                        <option value="AZnzlk1XvdvUeBnXmlld">Domi - Energetic (Upbeat, engaging)</option>
                        <option value="MF3mGyEYCl7XYWbV9V6O">Elli - Young Female (Friendly, casual)</option>
                        <option value="TxGEqnHWrfWFTfGW9XjX">Josh - Young Male (Casual, relatable)</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Leave as "Use Global Voice Settings" to use the same voice as frontend chat
                      </p>
                    </div>

                    {settings.adminChatVoice?.voiceId && (
                      <>
                        {/* Voice Settings Override */}
                        <div className="space-y-3 pt-2">
                          <p className="text-sm font-medium text-muted-foreground">Custom Voice Settings (optional)</p>

                          {/* Stability */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-xs">Stability</Label>
                              <span className="text-xs text-muted-foreground">
                                {Math.round((settings.adminChatVoice?.stability ?? settings.elevenLabsStability ?? 0.5) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={settings.adminChatVoice?.stability ?? settings.elevenLabsStability ?? 0.5}
                              onChange={(e) => setSettings({
                                ...settings,
                                adminChatVoice: {
                                  ...settings.adminChatVoice!,
                                  stability: parseFloat(e.target.value)
                                }
                              })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Similarity Boost */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-xs">Similarity Boost</Label>
                              <span className="text-xs text-muted-foreground">
                                {Math.round((settings.adminChatVoice?.similarityBoost ?? settings.elevenLabsSimilarity ?? 0.75) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={settings.adminChatVoice?.similarityBoost ?? settings.elevenLabsSimilarity ?? 0.75}
                              onChange={(e) => setSettings({
                                ...settings,
                                adminChatVoice: {
                                  ...settings.adminChatVoice!,
                                  similarityBoost: parseFloat(e.target.value)
                                }
                              })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Speaker Boost */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.adminChatVoice?.useSpeakerBoost ?? settings.elevenLabsSpeakerBoost ?? true}
                              onChange={(e) => setSettings({
                                ...settings,
                                adminChatVoice: {
                                  ...settings.adminChatVoice!,
                                  useSpeakerBoost: e.target.checked
                                }
                              })}
                              className="h-3.5 w-3.5 rounded border-gray-300"
                            />
                            <div className="text-xs">Speaker Boost</div>
                          </label>
                        </div>

                        {/* Preview Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            if (!settings.elevenLabsApiKey || !settings.adminChatVoice?.voiceId) return;
                            showMessage('success', 'Generating admin chat voice preview...');
                            try {
                              const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${settings.adminChatVoice.voiceId}`, {
                                method: 'POST',
                                headers: {
                                  'Accept': 'audio/mpeg',
                                  'Content-Type': 'application/json',
                                  'xi-api-key': settings.elevenLabsApiKey,
                                },
                                body: JSON.stringify({
                                  text: "Hi, I'm your Admin Assistant. I can help you with articles, users, settings, and more!",
                                  model_id: settings.elevenLabsModel || 'eleven_turbo_v2',
                                  voice_settings: {
                                    stability: settings.adminChatVoice.stability ?? settings.elevenLabsStability ?? 0.5,
                                    similarity_boost: settings.adminChatVoice.similarityBoost ?? settings.elevenLabsSimilarity ?? 0.75,
                                    style: settings.adminChatVoice.style ?? settings.elevenLabsStyle ?? 0,
                                    use_speaker_boost: settings.adminChatVoice.useSpeakerBoost ?? settings.elevenLabsSpeakerBoost ?? true,
                                  },
                                }),
                              });
                              if (response.ok) {
                                const audioBlob = await response.blob();
                                const audioUrl = URL.createObjectURL(audioBlob);
                                const audio = new Audio(audioUrl);
                                audio.play();
                                showMessage('success', 'Playing admin chat voice preview...');
                              } else {
                                showMessage('error', 'Preview failed. Check your API key.');
                              }
                            } catch {
                              showMessage('error', 'Preview failed');
                            }
                          }}
                        >
                          <Volume2 size={14} className="mr-2" /> Preview Admin Chat Voice
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
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
    // Use Firestore prompt if loaded, fall back to default
    const agentData = currentAgentPrompt || AGENT_PROMPTS[agentKey];
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
          <div className="flex-grow flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 overflow-hidden">
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
                  {/* Apply to Article button when JSON is detected */}
                  {aiGeneratedData && selectedArticleForAction && (
                    <div className="flex flex-col gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle size={16} />
                        <span className="font-semibold">Ready to Apply Changes</span>
                      </div>
                      <div className="text-xs text-green-700">
                        {aiGeneratedData.hashtags && `${aiGeneratedData.hashtags.length} hashtags will be added`}
                        {aiGeneratedData.optimizedTitle && `SEO metadata (title, description, alt text) will be updated`}
                        {aiGeneratedData.schemaJsonLd && `Schema.org JSON-LD will be added`}
                        {aiGeneratedData.localKeywords && `Local keywords and geo tags will be added`}
                        {aiGeneratedData.people && `Entities (people, orgs, locations) will be saved`}
                        {aiGeneratedData.authorBio && `E-E-A-T content will be shown in chat`}
                        {aiGeneratedData.definitiveAnswer && `Citation snippets will be shown in chat`}
                        {aiGeneratedData.metaDescription && !aiGeneratedData.optimizedTitle && `SEO metadata will be updated`}
                        {!aiGeneratedData.hashtags && !aiGeneratedData.metaDescription && !aiGeneratedData.optimizedTitle && !aiGeneratedData.schemaJsonLd && !aiGeneratedData.localKeywords && !aiGeneratedData.people && !aiGeneratedData.authorBio && !aiGeneratedData.definitiveAnswer && `All fields will be merged into the article`}
                      </div>
                      <Button
                        onClick={async () => {
                          const article = articles.find(a => a.id === selectedArticleForAction);

                          // Handle hashtags
                          if (aiGeneratedData.hashtags) {
                            await updateSelectedArticle({ hashtags: aiGeneratedData.hashtags });
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `✅ Applied ${aiGeneratedData.hashtags.length} hashtags to "${article?.title}"`
                            }]);
                          }
                          // Handle SEO metadata (from SEO Analyzer)
                          else if (aiGeneratedData.optimizedTitle) {
                            const updates: Partial<Article> = {
                              title: aiGeneratedData.optimizedTitle,
                              metaDescription: aiGeneratedData.metaDescription,
                              imageAltText: aiGeneratedData.imageAltText,
                            };
                            if (aiGeneratedData.focusKeywords) {
                              updates.keywords = aiGeneratedData.focusKeywords;
                            }
                            await updateSelectedArticle(updates);
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `✅ Applied SEO metadata (title, description, alt text) to "${article?.title}"`
                            }]);
                          }
                          // Handle Schema JSON-LD
                          else if (aiGeneratedData.schemaJsonLd) {
                            await updateSelectedArticle({
                              schema: JSON.stringify(aiGeneratedData.schemaJsonLd)
                            });
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `✅ Applied Schema.org JSON-LD to "${article?.title}"`
                            }]);
                          }
                          // Handle Local GEO keywords
                          else if (aiGeneratedData.localKeywords) {
                            await updateSelectedArticle({
                              localKeywords: aiGeneratedData.localKeywords,
                              geoTags: aiGeneratedData.geoTags,
                            });
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `✅ Applied ${aiGeneratedData.localKeywords.length} local keywords and ${aiGeneratedData.geoTags?.length || 0} geo tags to "${article?.title}"\n\n📍 Local Context to add:\n${aiGeneratedData.localContext}`
                            }]);
                          }
                          // Handle Entity mapping
                          else if (aiGeneratedData.people || aiGeneratedData.organizations) {
                            await updateSelectedArticle({
                              entities: {
                                people: aiGeneratedData.people,
                                organizations: aiGeneratedData.organizations,
                                locations: aiGeneratedData.locations,
                                topics: aiGeneratedData.topics,
                              }
                            });
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `✅ Saved entities for "${article?.title}"\n\n👤 People: ${aiGeneratedData.people?.join(', ')}\n🏢 Orgs: ${aiGeneratedData.organizations?.join(', ')}\n📍 Locations: ${aiGeneratedData.locations?.join(', ')}\n🏷️ Topics: ${aiGeneratedData.topics?.join(', ')}`
                            }]);
                          }
                          // Handle E-E-A-T content (display in chat, user can manually add to article)
                          else if (aiGeneratedData.authorBio) {
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `📝 **E-E-A-T Content Suggestions** for "${article?.title}":\n\n**Author Bio:**\n${aiGeneratedData.authorBio}\n\n**Expert Quote:**\n${aiGeneratedData.expertQuote}\n\n**Source Attribution:**\n${aiGeneratedData.sourceAttribution}\n\n**Trust Signal:**\n${aiGeneratedData.trustSignal}\n\n💡 Copy and paste these into your article to strengthen E-E-A-T signals.`
                            }]);
                          }
                          // Handle AI Citation snippets (display in chat)
                          else if (aiGeneratedData.definitiveAnswer) {
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `🎯 **AI Citation Snippets** for "${article?.title}":\n\n**Definitive Answer:**\n${aiGeneratedData.definitiveAnswer}\n\n**Statistic:**\n${aiGeneratedData.statisticSnippet}\n\n**Expert Quote:**\n${aiGeneratedData.expertQuote}\n\n**Summary:**\n${aiGeneratedData.keySummary}\n\n**Key Points:**\n${aiGeneratedData.bulletPoints?.map((p: string) => `• ${p}`).join('\n')}\n\n💡 Add these snippets to your article to increase AI citation probability.`
                            }]);
                          }
                          // Handle standalone meta description
                          else if (aiGeneratedData.metaDescription) {
                            await updateSelectedArticle({
                              metaDescription: aiGeneratedData.metaDescription,
                              imageAltText: aiGeneratedData.imageAltText,
                            });
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `✅ Applied SEO metadata to "${article?.title}"`
                            }]);
                          }
                          // Handle generic updates
                          else {
                            await updateSelectedArticle(aiGeneratedData);
                            setChatHistory(prev => [...prev, {
                              role: 'model',
                              text: `✅ Applied all changes to "${article?.title}"`
                            }]);
                          }
                          setAiGeneratedData(null);
                        }}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Apply to Article
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-muted/30">
                <div className="flex gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setChatHistory([]);
                      setAiGeneratedData(null);
                      showMessage('success', 'Chat cleared');
                    }}
                    className="flex-1"
                  >
                    <X size={14} className="mr-2" /> Clear Chat
                  </Button>
                  {aiGeneratedData && (
                    <Badge variant="secondary" className="px-3 py-1">
                      ✓ JSON Ready
                    </Badge>
                  )}
                </div>
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
            <div className="w-full lg:w-[420px] flex flex-col gap-4 overflow-y-auto pr-2 shrink-0">
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
                              <><RefreshCw size={14} className="animate-spin mr-2" /> <span className="hidden sm:inline">Reviewing...</span><span className="sm:hidden">...</span></>
                            ) : (
                              <><CheckCircle size={14} className="mr-2" /> <span className="hidden sm:inline">Run Editorial Review</span><span className="sm:hidden">Review</span></>
                            )}
                          </Button>
                          <Button
                            onClick={handleForwardToChief}
                            disabled={!selectedArticleForAction}
                            className="w-full bg-primary hover:bg-primary/90"
                          >
                            <ArrowRight size={14} className="mr-2" /> <span className="hidden sm:inline">Approve & Publish</span><span className="sm:hidden">Publish</span>
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

              {/* SEO Agent Tools */}
              {activeTab === 'SEO' && (
                <>
                  {/* Article Selector */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText size={18} className="text-purple-600" /> Select Article
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Choose article to optimize ({articles.length} total)
                        </Label>
                        <select
                          value={selectedArticleForAction}
                          onChange={e => setSelectedArticleForAction(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Choose article...</option>
                          {articles.map(article => (
                            <option key={article.id} value={article.id}>
                              {article.title || 'Untitled'} - {article.status}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedArticleForAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const article = articles.find(a => a.id === selectedArticleForAction);
                            if (article) setAgentArticle(article);
                          }}
                        >
                          <Edit size={14} className="mr-2" /> Open in Editor
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* SEO Analyzer Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart size={18} className="text-purple-600" /> SEO Analyzer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedArticleForAction ? (
                        <div className="bg-muted/50 border rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Select an article above to analyze</p>
                        </div>
                      ) : (() => {
                        const selectedArticle = articles.find(a => a.id === selectedArticleForAction);
                        return (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Title Length</span>
                                <Badge variant={selectedArticle?.title && selectedArticle.title.length >= 50 && selectedArticle.title.length <= 60 ? "default" : "secondary"}>
                                  {selectedArticle?.title?.length || 0}/60
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Meta Description</span>
                                <Badge variant={selectedArticle?.metaDescription ? "default" : "destructive"}>
                                  {selectedArticle?.metaDescription ? `${selectedArticle.metaDescription.length}/155` : 'Missing'}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Image Alt Text</span>
                                <Badge variant={selectedArticle?.imageAltText ? "default" : "secondary"}>
                                  {selectedArticle?.imageAltText ? 'Set' : 'Missing'}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Hashtags</span>
                                <Badge variant={(selectedArticle?.hashtags?.length || 0) > 0 ? "default" : "secondary"}>
                                  {selectedArticle?.hashtags?.length || 0} tags
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const prompt = `Analyze and optimize this article for SEO. Return ONLY a JSON object with optimized values.

Article:
Title: ${selectedArticle?.title || 'Untitled'}
Meta Description: ${selectedArticle?.metaDescription || 'Not set'}
Image Alt Text: ${selectedArticle?.imageAltText || 'Not set'}
Content: ${selectedArticle?.content?.substring(0, 1500) || 'No content'}

Return ONLY this JSON structure:
{
  "optimizedTitle": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Compelling meta description (140-155 chars)",
  "imageAltText": "Descriptive alt text for featured image",
  "focusKeywords": ["keyword1", "keyword2", "keyword3"]
}

Requirements:
- Title: Include primary keyword, 50-60 characters, compelling
- Meta Description: Include call-to-action, 140-155 characters, include keyword
- Image Alt Text: Descriptive, include location/context if applicable
- Focus Keywords: 3-5 most important keywords for this article

Return ONLY the JSON object, no other text.`;
                                sendPromptToAi(prompt);
                              }}
                            >
                              <Search size={14} className="mr-2" /> Generate SEO Metadata
                            </Button>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Keyword Research Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Key size={18} className="text-purple-600" /> Keyword Research
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const prompt = `Based on this article, suggest optimal keywords:\n\nTitle: ${agentArticle?.title || 'Untitled'}\nCategory: ${agentArticle?.category || 'General'}\n\nContent: ${agentArticle?.content?.substring(0, 1000) || 'No content'}\n\nProvide:\n1. Primary keyword (1-2)\n2. Secondary keywords (3-5)\n3. Long-tail keyword variations (3-5)\n4. Local/geographic keywords for Eastern NC\n5. "People Also Ask" style questions`;
                          sendPromptToAi(prompt);
                        }}
                      >
                        <Target size={14} className="mr-2" /> Generate Keywords
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const prompt = `Analyze keyword density in this article:\n\nTitle: ${agentArticle?.title || 'Untitled'}\n\nContent: ${agentArticle?.content?.substring(0, 2000) || 'No content'}\n\nIdentify the most frequently used terms and suggest if any keywords are over-used or under-used. Recommend optimal keyword placement.`;
                          sendPromptToAi(prompt);
                        }}
                      >
                        <BarChart size={14} className="mr-2" /> Check Density
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Headline Optimizer Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Heading size={18} className="text-purple-600" /> Headline Optimizer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium truncate">{agentArticle?.title || 'No title set'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{agentArticle?.title?.length || 0} characters</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const prompt = `Generate 5 headline variations for this article:\n\nCurrent Title: ${agentArticle?.title || 'Untitled'}\nCategory: ${agentArticle?.category || 'General'}\n\nContent Summary: ${agentArticle?.content?.substring(0, 500) || 'No content'}\n\nProvide 5 alternatives in different styles:\n1. News style (factual, objective)\n2. Question format (engaging curiosity)\n3. How-to format (if applicable)\n4. Listicle format (if applicable)\n5. Emotional hook (compelling, human interest)\n\nFor each, note the character count and key power words used.`;
                          sendPromptToAi(prompt);
                        }}
                      >
                        <Sparkles size={14} className="mr-2" /> Generate Variations
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SEO Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-2xl font-bold">{agentArticle?.content?.split(/\s+/).filter(w => w.length > 0).length || 0}</div>
                          <div className="text-xs text-muted-foreground mt-1">Words</div>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-2xl font-bold">{Math.ceil((agentArticle?.content?.split(/\s+/).filter(w => w.length > 0).length || 0) / 200)}</div>
                          <div className="text-xs text-muted-foreground mt-1">Min Read</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* SOCIAL Agent Tools */}
              {activeTab === 'SOCIAL' && (
                <>
                  {/* Article Selector */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText size={18} className="text-pink-600" /> Select Article
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Choose article to create social posts ({articles.length} total)
                        </Label>
                        <select
                          value={selectedArticleForAction}
                          onChange={e => setSelectedArticleForAction(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Choose article...</option>
                          {articles.map(article => (
                            <option key={article.id} value={article.id}>
                              {article.title || 'Untitled'} - {article.status}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedArticleForAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const article = articles.find(a => a.id === selectedArticleForAction);
                            if (article) setAgentArticle(article);
                          }}
                        >
                          <Edit size={14} className="mr-2" /> Open in Editor
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Platform Post Generator */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Share2 size={18} className="text-pink-600" /> Platform Posts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedArticleForAction ? (
                        <div className="bg-muted/50 border rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Select an article above to generate posts</p>
                        </div>
                      ) : (() => {
                        const selectedArticle = articles.find(a => a.id === selectedArticleForAction);
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const prompt = `Create a Twitter/X post for this article:\n\nTitle: ${selectedArticle?.title || 'Untitled'}\nContent: ${selectedArticle?.content?.substring(0, 500) || 'No content'}\n\nRequirements:\n- Maximum 280 characters\n- Include 2-3 relevant hashtags\n- Make it engaging and shareable\n- Include a call to action`;
                                  sendPromptToAi(prompt);
                                }}
                              >
                                <Twitter size={14} className="mr-1" /> Twitter/X
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const prompt = `Create a Facebook post for this article:\n\nTitle: ${selectedArticle?.title || 'Untitled'}\nContent: ${selectedArticle?.content?.substring(0, 500) || 'No content'}\n\nRequirements:\n- Optimal length: 100-250 characters for engagement\n- Include 1-2 hashtags\n- Ask a question or include a call to action\n- Make it conversational and community-focused`;
                                  sendPromptToAi(prompt);
                                }}
                              >
                                <Facebook size={14} className="mr-1" /> Facebook
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const prompt = `Create an Instagram caption for this article:\n\nTitle: ${selectedArticle?.title || 'Untitled'}\nContent: ${selectedArticle?.content?.substring(0, 500) || 'No content'}\n\nRequirements:\n- Engaging opening line (hook)\n- Story-like narrative style\n- Include 15-20 relevant hashtags at the end\n- Add appropriate emojis\n- Include a call to action (link in bio reference)`;
                                  sendPromptToAi(prompt);
                                }}
                              >
                                <Instagram size={14} className="mr-1" /> Instagram
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const prompt = `Create a LinkedIn post for this article:\n\nTitle: ${selectedArticle?.title || 'Untitled'}\nContent: ${selectedArticle?.content?.substring(0, 500) || 'No content'}\n\nRequirements:\n- Professional tone\n- Optimal length: 150-300 characters\n- Include 3-5 industry hashtags\n- Add insight or commentary\n- End with a thought-provoking question`;
                                  sendPromptToAi(prompt);
                                }}
                              >
                                <Linkedin size={14} className="mr-1" /> LinkedIn
                              </Button>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => {
                                const prompt = `Create social media posts for ALL platforms for this article:\n\nTitle: ${selectedArticle?.title || 'Untitled'}\nContent: ${selectedArticle?.content?.substring(0, 800) || 'No content'}\n\nGenerate optimized posts for:\n1. Twitter/X (280 chars, 2-3 hashtags)\n2. Facebook (100-250 chars, conversational)\n3. Instagram (caption + 15-20 hashtags)\n4. LinkedIn (professional, 150-300 chars)\n\nMake each platform-specific and ready to copy-paste.`;
                                sendPromptToAi(prompt);
                              }}
                            >
                              <Sparkles size={14} className="mr-2" /> Generate All Posts
                            </Button>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Hashtag Research */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Hash size={18} className="text-pink-600" /> Hashtag Center
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedArticleForAction ? (
                        <div className="bg-muted/50 border rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Select an article above to generate hashtags</p>
                        </div>
                      ) : (() => {
                        const selectedArticle = articles.find(a => a.id === selectedArticleForAction);
                        return (
                          <>
                            {selectedArticle?.hashtags && selectedArticle.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {selectedArticle.hashtags.map((tag: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const prompt = `Generate hashtags for this article and return them in JSON format.

Article:
Title: ${selectedArticle?.title || 'Untitled'}
Category: ${selectedArticle?.category || 'General'}
Content: ${selectedArticle?.content?.substring(0, 500) || 'No content'}

Return ONLY a JSON object with this exact structure:
{
  "hashtags": ["#HashtagHere1", "#HashtagHere2", ...],
  "twitterHashtags": ["#Tag1", "#Tag2", "#Tag3"],
  "instagramHashtags": ["#Tag1", "#Tag2", ..., "#Tag15-20"],
  "linkedinHashtags": ["#Tag1", "#Tag2", "#Tag3"]
}

Include:
- General hashtags (10-15 total): Topic-specific, Local/Geographic (#EasternNC, #NCNews), Trending/Timely, and Evergreen (#BreakingNews, #LocalNews)
- Twitter set: 2-3 most impactful hashtags
- Instagram set: 15-20 comprehensive hashtags
- LinkedIn set: 3-5 professional hashtags

Return ONLY the JSON object, no other text.`;
                                sendPromptToAi(prompt);
                              }}
                            >
                              <Hash size={14} className="mr-2" /> Generate Hashtags
                            </Button>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Engagement Tips */}
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Best Posting Times (EST)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Twitter size={12} /> Twitter/X</span>
                        <span className="font-medium">9am, 12pm, 6pm</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Facebook size={12} /> Facebook</span>
                        <span className="font-medium">1-4pm weekdays</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Instagram size={12} /> Instagram</span>
                        <span className="font-medium">11am-1pm, 7-9pm</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Linkedin size={12} /> LinkedIn</span>
                        <span className="font-medium">Tue-Thu 10am</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cross-Platform Checklist */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Post Checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <Twitter size={14} /> Posted to Twitter/X
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <Facebook size={14} /> Posted to Facebook
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <Instagram size={14} /> Posted to Instagram
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <Linkedin size={14} /> Posted to LinkedIn
                      </label>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* GEO Agent Tools */}
              {activeTab === 'GEO' && (
                <>
                  {/* Article Selector */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText size={18} className="text-teal-600" /> Select Article
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Choose article to optimize for GEO ({articles.length} total)
                        </Label>
                        <select
                          value={selectedArticleForAction}
                          onChange={e => setSelectedArticleForAction(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Choose article...</option>
                          {articles.map(article => (
                            <option key={article.id} value={article.id}>
                              {article.title || 'Untitled'} - {article.status}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedArticleForAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const article = articles.find(a => a.id === selectedArticleForAction);
                            if (article) setAgentArticle(article);
                          }}
                        >
                          <Edit size={14} className="mr-2" /> Open in Editor
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Structured Data Generator */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe size={18} className="text-teal-600" /> Structured Data (JSON-LD)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedArticleForAction ? (
                        <div className="bg-muted/50 border rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Select an article above to generate schema</p>
                        </div>
                      ) : (() => {
                        const selectedArticle = articles.find(a => a.id === selectedArticleForAction);
                        return (
                          <>
                            <p className="text-xs text-muted-foreground">Generate Schema.org structured data to maximize AI search visibility.</p>
                            <Button
                              className="w-full"
                              onClick={() => {
                                const prompt = `Generate Schema.org JSON-LD for this article. Return ONLY a JSON object.

Article:
Title: ${selectedArticle?.title || 'Untitled'}
Author: ${selectedArticle?.author || 'Staff Writer'}
Category: ${selectedArticle?.category || 'News'}
Published: ${selectedArticle?.publishedAt || new Date().toISOString()}
Image URL: ${selectedArticle?.featuredImage || selectedArticle?.imageUrl || ''}
Content: ${selectedArticle?.content?.substring(0, 800) || 'No content'}

Return ONLY this JSON structure:
{
  "schemaJsonLd": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "headline": "article title here",
        "description": "article description",
        "image": "image URL",
        "author": {
          "@type": "Person",
          "name": "author name"
        },
        "publisher": {
          "@type": "Organization",
          "name": "WNC News",
          "logo": {
            "@type": "ImageObject",
            "url": "https://wncnews.com/logo.png"
          }
        },
        "datePublished": "ISO date",
        "dateModified": "ISO date"
      }
    ]
  }
}

Generate complete NewsArticle schema with all required properties. Return ONLY the JSON object, no other text.`;
                                sendPromptToAi(prompt);
                              }}
                            >
                              <Sparkles size={14} className="mr-2" /> Generate Schema JSON-LD
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const prompt = `Generate a NewsArticle Schema.org JSON-LD for:\n\nTitle: ${selectedArticle?.title || 'Untitled'}\nAuthor: ${selectedArticle?.author || 'Staff'}\nDate: ${selectedArticle?.publishedAt || new Date().toISOString()}\nCategory: ${selectedArticle?.category || 'News'}\n\nProvide valid JSON-LD format.`;
                                  sendPromptToAi(prompt);
                                }}
                              >
                                NewsArticle
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const prompt = `Generate LocalBusiness and Organization Schema.org JSON-LD for WNC News, a local news publication serving Eastern North Carolina. Include proper @context, @type, name, and location properties.`;
                                  sendPromptToAi(prompt);
                                }}
                              >
                                Organization
                              </Button>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* AI Citation Optimizer */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target size={18} className="text-teal-600" /> AI Citation Optimizer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedArticleForAction ? (
                        <div className="bg-muted/50 border rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Select an article above to optimize citations</p>
                        </div>
                      ) : (() => {
                        const selectedArticle = articles.find(a => a.id === selectedArticleForAction);
                        return (
                          <>
                            <p className="text-xs text-muted-foreground">Optimize content to be cited by AI engines (Google SGE, Perplexity, ChatGPT).</p>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const prompt = `Generate AI-citation snippets for this article. Return ONLY a JSON object.

Article:
Title: ${selectedArticle?.title || 'Untitled'}
Content: ${selectedArticle?.content?.substring(0, 1500) || 'No content'}

Return ONLY this JSON structure:
{
  "definitiveAnswer": "A clear, quotable answer sentence (for featured snippets)",
  "statisticSnippet": "A sentence with a key statistic or data point",
  "expertQuote": "An expert attribution or authoritative quote",
  "keySummary": "A summary sentence with key facts (self-contained)",
  "bulletPoints": ["Key point 1", "Key point 2", "Key point 3"]
}

Each field should be self-contained and optimized to be cited by AI search engines. Return ONLY the JSON object, no other text.`;
                                sendPromptToAi(prompt);
                              }}
                            >
                              <Copy size={14} className="mr-2" /> Generate Citation Content
                            </Button>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Entity & Topic Mapper */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Link2 size={18} className="text-teal-600" /> Entity Mapper
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedArticleForAction ? (
                        <div className="bg-muted/50 border rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Select an article above to extract entities</p>
                        </div>
                      ) : (() => {
                        const selectedArticle = articles.find(a => a.id === selectedArticleForAction);
                        return (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const prompt = `Extract entities from this article for knowledge graph optimization. Return ONLY a JSON object.

Article:
Title: ${selectedArticle?.title || 'Untitled'}
Content: ${selectedArticle?.content?.substring(0, 1500) || 'No content'}

Return ONLY this JSON structure:
{
  "people": ["Person Name (Role)", "Another Person (Title)"],
  "organizations": ["Organization Name", "Another Org"],
  "locations": ["City, County", "Landmark Name"],
  "topics": ["Topic 1", "Topic 2", "Topic 3"],
  "relatedKeywords": ["related term 1", "related term 2"]
}

Include:
- People: Names with their roles/titles in parentheses
- Organizations: Businesses, government agencies, nonprofits mentioned
- Locations: Cities, counties, landmarks (format: "Name, Context")
- Topics: 3-5 main topic categories
- Related Keywords: 5-8 related terms for topical authority

Return ONLY the JSON object, no other text.`;
                              sendPromptToAi(prompt);
                            }}
                          >
                            <Search size={14} className="mr-2" /> Extract Entities
                          </Button>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* EEAT Enhancer */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield size={18} className="text-teal-600" /> E-E-A-T Enhancer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedArticleForAction ? (
                        <div className="bg-muted/50 border rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Select an article above to analyze E-E-A-T</p>
                        </div>
                      ) : (() => {
                        const selectedArticle = articles.find(a => a.id === selectedArticleForAction);
                        return (
                          <>
                            <p className="text-xs text-muted-foreground">Experience, Expertise, Authority, Trust signals for Google & AI.</p>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const prompt = `Enhance this article with E-E-A-T signals. Return ONLY a JSON object.

Article:
Title: ${selectedArticle?.title || 'Untitled'}
Author: ${selectedArticle?.author || 'Staff'}
Content: ${selectedArticle?.content?.substring(0, 1500) || 'No content'}

Return ONLY this JSON structure:
{
  "authorBio": "Brief author credentials/bio to add (1-2 sentences)",
  "expertQuote": "A sample expert quote attribution to add if not present (e.g., 'According to Dr. Jane Smith, local historian...')",
  "sourceAttribution": "Sample source citation to strengthen authority (e.g., 'Data from NC Department of Transportation shows...')",
  "trustSignal": "Transparency statement to add (e.g., 'This story was updated on [date] to include additional information from...')"
}

Generate realistic, relevant content that strengthens E-E-A-T signals. Return ONLY the JSON object, no other text.`;
                                sendPromptToAi(prompt);
                              }}
                            >
                              <CheckCircle size={14} className="mr-2" /> Generate E-E-A-T Content
                            </Button>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Local News GEO */}
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Local News Optimization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedArticleForAction ? (
                        <div className="bg-muted/50 border rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">Select an article above for local optimization</p>
                        </div>
                      ) : (() => {
                        const selectedArticle = articles.find(a => a.id === selectedArticleForAction);
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              const prompt = `Optimize this article for local Eastern NC search visibility. Return ONLY a JSON object.

Article:
Title: ${selectedArticle?.title || 'Untitled'}
Content: ${selectedArticle?.content?.substring(0, 1000) || 'No content'}

Return ONLY this JSON structure:
{
  "localKeywords": ["Eastern NC", "Wayne County", "Duplin County", "etc"],
  "geoTags": ["Goldsboro", "Mount Olive", "Kinston", "etc"],
  "localContext": "Brief paragraph to add that strengthens local relevance (2-3 sentences mentioning specific counties/cities/landmarks)"
}

Include:
- 5-8 local keywords (county names, city names, regional terms like "Eastern NC", "Coastal Plain")
- 3-5 specific geo tags (cities/towns mentioned or relevant to the story)
- A short paragraph (2-3 sentences) that adds local geographic context

Return ONLY the JSON object, no other text.`;
                              sendPromptToAi(prompt);
                            }}
                          >
                            <Globe size={14} className="mr-2" /> Generate Local GEO
                          </Button>
                        );
                      })()}
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
            {/* Fact Check Button with Mode Selector */}
            <div className="relative fact-check-mode-selector">
              <div className="flex">
                <button
                  onClick={() => handleFactCheck(factCheckMode)}
                  disabled={isFactChecking || !agentArticle?.title || !agentArticle?.content}
                  className="px-5 py-2.5 bg-blue-500 text-white font-medium rounded-l-xl hover:bg-blue-600 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFactChecking ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {factCheckMode === 'quick' ? 'Quick Check' : 'Detailed Check'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowFactCheckModeMenu(!showFactCheckModeMenu)}
                  disabled={isFactChecking}
                  className="px-3 py-2.5 bg-blue-500 text-white font-medium rounded-r-xl hover:bg-blue-600 transition-all duration-200 border-l border-blue-400/50 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Mode Selector Dropdown */}
              {showFactCheckModeMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 w-64">
                  <button
                    onClick={() => {
                      setFactCheckMode('quick');
                      setShowFactCheckModeMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${factCheckMode === 'quick' ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={16} className={factCheckMode === 'quick' ? 'text-blue-500' : 'text-slate-400'} />
                      <div>
                        <div className="font-medium text-sm">Quick Check</div>
                        <div className="text-xs text-slate-500">Fast confidence score only</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setFactCheckMode('detailed');
                      setShowFactCheckModeMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${factCheckMode === 'detailed' ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileSearch size={16} className={factCheckMode === 'detailed' ? 'text-blue-500' : 'text-slate-400'} />
                      <div>
                        <div className="font-medium text-sm">Detailed Check</div>
                        <div className="text-xs text-slate-500">Full claim-by-claim analysis</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                if (agentArticle.status === 'draft') {
                  const updatedArticle = {...agentArticle, status: 'review' as const};
                  // Pass the updated article directly to avoid state timing issues
                  await handleSaveAgentArticle(false, updatedArticle);
                  // Show confirmation toast
                  showMessage('success', `📨 "${agentArticle.title}" sent to editor for review!`);
                  setChatHistory(prev => [...prev, { role: 'model', text: `📨 **Sent to Editor!** "${agentArticle.title}" is now in Review status.` }]);
                  setAgentArticle(null);
                  // Navigate to articles list
                  setActiveTab('articles');
                }
              }}
              disabled={agentArticle.status !== 'draft'}
              className={`px-5 py-2.5 font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm ${
                agentArticle.status === 'draft'
                  ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <AlertCircle size={16} /> Send to Editor
            </button>
            <button
              onClick={async () => {
                await handleSaveAgentArticle(true);
                // After save, close editor and navigate to articles list
                setAgentArticle(null);
                setActiveTab('articles');
              }}
              disabled={!agentArticle?.title}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={17} /> Save
            </button>
            <button
              onClick={() => {
                setAgentArticle(null);
                setActiveTab('articles');
              }}
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

        {/* Cost Tracking Panel */}
        {agentArticle?.generationCosts && agentArticle.generationCosts.total > 0 && (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-8 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">Generation Cost:</span>
                  <span className="text-lg font-bold text-slate-900">{formatCost(agentArticle.generationCosts.total)}</span>
                </div>
                {agentArticle.generationCosts.breakdown && (
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    {agentArticle.generationCosts.breakdown.articleGeneration && (
                      <span>Content: {formatCost(agentArticle.generationCosts.breakdown.articleGeneration)}</span>
                    )}
                    {agentArticle.generationCosts.breakdown.imageGeneration && (
                      <span>AI Image: {formatCost(agentArticle.generationCosts.breakdown.imageGeneration)}</span>
                    )}
                    {agentArticle.generationCosts.breakdown.stockPhotoSearch !== undefined && (
                      <span>Stock Photo: {formatCost(agentArticle.generationCosts.breakdown.stockPhotoSearch)}</span>
                    )}
                    {agentArticle.generationCosts.breakdown.factCheck && (
                      <span>Fact-Check: {formatCost(agentArticle.generationCosts.breakdown.factCheck)}</span>
                    )}
                    {agentArticle.generationCosts.breakdown.visualExtraction && (
                      <span>Visual Extract: {formatCost(agentArticle.generationCosts.breakdown.visualExtraction)}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Last updated: {new Date(agentArticle.generationCosts.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Fact-Check Results Panel */}
        {factCheckResult && (
          <div className="bg-white border-b border-slate-200 px-8 py-4">
            <div className="max-w-4xl mx-auto">
              <div className={`rounded-xl border-2 p-6 ${
                factCheckResult.status === 'passed' ? 'bg-green-50 border-green-300' :
                factCheckResult.status === 'review_recommended' ? 'bg-blue-50 border-blue-300' :
                factCheckResult.status === 'caution' ? 'bg-yellow-50 border-yellow-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      factCheckResult.status === 'passed' ? 'bg-green-500 text-white' :
                      factCheckResult.status === 'review_recommended' ? 'bg-blue-500 text-white' :
                      factCheckResult.status === 'caution' ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {factCheckResult.status.toUpperCase().replace('_', ' ')}
                    </div>
                    <div className="text-3xl font-bold">
                      <span className={
                        factCheckResult.confidence >= 80 ? 'text-green-600' :
                        factCheckResult.confidence >= 60 ? 'text-blue-600' :
                        factCheckResult.confidence >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }>
                        {factCheckResult.confidence}%
                      </span>
                      <span className="text-sm text-slate-500 ml-2">confidence</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setFactCheckResult(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-slate-700 leading-relaxed">{factCheckResult.summary}</p>
                </div>

                {factCheckResult.mode === 'detailed' && factCheckResult.recommendations && factCheckResult.recommendations.length > 0 && (
                  <div className="mb-4 bg-white/50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} /> Recommendations:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                      {factCheckResult.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {factCheckResult.mode === 'detailed' && factCheckResult.claims && factCheckResult.claims.length > 0 && (
                  <div className="bg-white/50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle size={16} /> Claims Analysis:
                    </h4>
                    <div className="space-y-2">
                      {factCheckResult.claims.map((claim, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                            claim.status === 'verified' ? 'bg-green-100 text-green-700' :
                            claim.status === 'unverified' ? 'bg-yellow-100 text-yellow-700' :
                            claim.status === 'disputed' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {claim.status.toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">&quot;{claim.text}&quot;</p>
                            <p className="text-slate-600 mt-1">{claim.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={handleRegenerateImage}
                          disabled={isRegeneratingImage}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRegeneratingImage ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} />
                              Regenerate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setAgentArticle({...agentArticle, imageUrl: '', featuredImage: ''})}
                          disabled={isRegeneratingImage}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowMediaPicker(true)}
                      className="w-full h-64 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center hover:bg-slate-200 hover:border-blue-400 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="text-center">
                        <ImageIcon size={48} className="mx-auto text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                        <p className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors">Click to select from Media Library</p>
                      </div>
                    </button>
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
              <button onClick={() => setAgentTab('prompt')} className={`flex-1 py-4 text-sm font-medium transition-all duration-200 ${agentTab === 'prompt' ? 'text-slate-900 bg-white border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <Sparkles size={17} className="inline mr-2" /> Prompt
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
                                className="rounded-full object-cover aspect-square"
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
                                          className="rounded-full object-cover aspect-square"
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
                                            className="rounded-full object-cover aspect-square"
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

                  {/* SEO & Social Metadata Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                          <FileSearch size={16} className="text-blue-600" /> SEO & Social Metadata
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">Auto-generate descriptions, alt text, and hashtags for your article</p>
                      </div>
                      <button
                        onClick={() => handleGenerateMetadata(['metaDescription', 'imageAltText', 'hashtags'])}
                        disabled={isGeneratingMetadata || !agentArticle?.title || !agentArticle?.content}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isGeneratingMetadata ? <><RefreshCw size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate All</>}
                      </button>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Type size={12} /> Meta Description
                        </label>
                        <span className="text-xs text-slate-500">{(agentArticle.metaDescription || '').length}/155</span>
                      </div>
                      <div className="relative">
                        <textarea
                          value={agentArticle.metaDescription || ''}
                          onChange={e => setAgentArticle({...agentArticle, metaDescription: e.target.value.substring(0, 155)})}
                          placeholder="SEO meta description (max 155 characters)..."
                          rows={2}
                          className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-sm pr-20"
                        />
                        <button
                          onClick={() => handleGenerateMetadata(['metaDescription'])}
                          disabled={isGeneratingMetadata || !agentArticle?.title || !agentArticle?.content}
                          className="absolute right-2 top-2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Generate meta description"
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Image Alt Text */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                          <ImageIcon size={12} /> Image Alt Text
                        </label>
                        <span className="text-xs text-slate-500">{(agentArticle.imageAltText || '').length}/125</span>
                      </div>
                      <div className="relative">
                        <input
                          value={agentArticle.imageAltText || ''}
                          onChange={e => setAgentArticle({...agentArticle, imageAltText: e.target.value.substring(0, 125)})}
                          placeholder="Descriptive alt text for featured image..."
                          className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-sm pr-20"
                        />
                        <button
                          onClick={() => handleGenerateMetadata(['imageAltText'])}
                          disabled={isGeneratingMetadata || !agentArticle?.title || !agentArticle?.content}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Generate image alt text"
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Hash size={12} /> Hashtags
                        </label>
                        <span className="text-xs text-slate-500">{(agentArticle.hashtags || []).length} tags</span>
                      </div>
                      <div className="relative">
                        <input
                          value={(agentArticle.hashtags || []).join(' ')}
                          onChange={e => {
                            const hashtags = e.target.value
                              .split(/[\s,]+/)
                              .filter(tag => tag)
                              .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
                            setAgentArticle({...agentArticle, hashtags});
                          }}
                          placeholder="#LocalNews #WNC #Breaking..."
                          className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-sm pr-20"
                        />
                        <button
                          onClick={() => handleGenerateMetadata(['hashtags'])}
                          disabled={isGeneratingMetadata || !agentArticle?.title || !agentArticle?.content}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Generate hashtags"
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                      {(agentArticle.hashtags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {agentArticle.hashtags?.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {tag}
                              <button
                                onClick={() => setAgentArticle({...agentArticle, hashtags: agentArticle.hashtags?.filter((_, i) => i !== idx)})}
                                className="hover:text-blue-900"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {(!agentArticle?.title || !agentArticle?.content) && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle size={12} /> Add article title and content to enable AI generation
                      </p>
                    )}
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

              {/* Prompt Tab - Agent Prompt Editor */}
              {agentTab === 'prompt' && currentUser && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Sparkles size={18} className="text-purple-600" /> Agent Prompt
                    </h3>
                    <p className="text-sm text-slate-600 mb-6">Customize how this agent behaves and writes</p>
                  </div>
                  <AgentPromptEditor
                    agentType={activeTab as 'MASTER' | 'JOURNALIST' | 'EDITOR' | 'SEO' | 'SOCIAL' | 'GEO'}
                    userId={currentUser.uid}
                  />
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

  // Tools Section with Sanitize, Migrate, and Supabase Import
  const renderTools = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="h-8 w-8 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold">Tools</h1>
          <p className="text-muted-foreground">Database cleanup, migration, and import utilities</p>
        </div>
      </div>

      {/* Existing Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Migration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon size={20} className="text-blue-600" />
              Migrate Images
            </CardTitle>
            <CardDescription>
              Move all article images from temporary URLs (Supabase, DALL-E, etc.) to Firebase Storage for permanent hosting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {migratingImages && maintenanceProgress.message && (
              <div className="mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw size={14} className="animate-spin" />
                  {maintenanceProgress.message}
                </div>
                {maintenanceProgress.total > 0 && (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(maintenanceProgress.current / maintenanceProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={handleMigrateImages}
              disabled={migratingImages || sanitizingArticles}
              className="w-full"
            >
              {migratingImages ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Run Migration
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Content Sanitization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-green-600" />
              Sanitize Content
            </CardTitle>
            <CardDescription>
              Clean up article HTML, remove empty tags, fix formatting issues, and regenerate clean excerpts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sanitizingArticles && maintenanceProgress.message && (
              <div className="mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw size={14} className="animate-spin" />
                  {maintenanceProgress.message}
                </div>
                {maintenanceProgress.total > 0 && (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(maintenanceProgress.current / maintenanceProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={handleSanitizeArticles}
              disabled={migratingImages || sanitizingArticles}
              className="w-full"
              variant="secondary"
            >
              {sanitizingArticles ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Sanitizing...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Run Sanitization
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Supabase Import Tool */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} className="text-purple-600" />
            Supabase Import
          </CardTitle>
          <CardDescription>
            Import articles, images, categories, and authors from an external Supabase database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">Supabase URL</Label>
              <Input
                id="supabaseUrl"
                placeholder="https://your-project.supabase.co"
                value={supabaseConfig.url}
                onChange={(e) => setSupabaseConfig(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabaseKey">API Key (anon or service)</Label>
              <div className="relative">
                <Input
                  id="supabaseKey"
                  type={showSupabaseKey ? "text" : "password"}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseConfig.key}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, key: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                >
                  {showSupabaseKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date (optional)</Label>
              <Input
                id="dateFrom"
                type="date"
                value={supabaseConfig.dateFrom}
                onChange={(e) => setSupabaseConfig(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date (optional)</Label>
              <Input
                id="dateTo"
                type="date"
                value={supabaseConfig.dateTo}
                onChange={(e) => setSupabaseConfig(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>

          {/* Import Options */}
          <div className="space-y-2">
            <Label>Import Options</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supabaseConfig.importArticles}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, importArticles: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span>Articles</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supabaseConfig.importImages}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, importImages: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span>Images</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supabaseConfig.importCategories}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, importCategories: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span>Categories</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supabaseConfig.importAuthors}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, importAuthors: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span>Authors</span>
              </label>
            </div>
          </div>

          {/* Clear First Option - Destructive */}
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={supabaseConfig.clearFirst}
                onChange={(e) => setSupabaseConfig(prev => ({ ...prev, clearFirst: e.target.checked }))}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="font-medium text-red-700 dark:text-red-400">Clear All & Fresh Import</span>
                <p className="text-xs text-red-600 dark:text-red-500">
                  Delete ALL existing articles before importing. Use this for a clean sync from Supabase.
                </p>
              </div>
            </label>
          </div>

          {/* Progress Display */}
          {supabaseImporting && supabaseProgress.message && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={16} className="animate-spin text-purple-600" />
                <span className="font-medium">{supabaseProgress.message}</span>
              </div>
              {supabaseProgress.total > 0 && (
                <>
                  <div className="h-2 bg-background rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${(supabaseProgress.current / supabaseProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {supabaseProgress.current} of {supabaseProgress.total} ({Math.round((supabaseProgress.current / supabaseProgress.total) * 100)}%)
                  </p>
                </>
              )}
            </div>
          )}

          {/* Import Results */}
          {supabaseResults && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Import Complete
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Articles</p>
                  <p className="font-medium">{supabaseResults.articles?.imported || 0} imported</p>
                  {supabaseResults.articles?.skipped > 0 && (
                    <p className="text-xs text-muted-foreground">{supabaseResults.articles.skipped} skipped</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Images</p>
                  <p className="font-medium">{supabaseResults.images?.imported || 0} imported</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Categories</p>
                  <p className="font-medium">{supabaseResults.categories?.imported || 0} imported</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Authors</p>
                  <p className="font-medium">{supabaseResults.authors?.imported || 0} imported</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSupabasePreview}
              disabled={supabaseImporting || !supabaseConfig.url || !supabaseConfig.key}
            >
              <Eye size={16} className="mr-2" />
              Preview Import
            </Button>
            <Button
              onClick={handleSupabaseImport}
              disabled={supabaseImporting || !supabaseConfig.url || !supabaseConfig.key}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {supabaseImporting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Start Import
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Supabase Image Migration Tool (Server-side Firebase Admin) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud size={20} className="text-orange-600" />
            Migrate Supabase Images to Firebase
          </CardTitle>
          <CardDescription>
            Download all images stored in Supabase and re-upload them to Firebase Storage.
            This allows you to fully decommission Supabase and run entirely on Firebase/Vercel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview Results */}
          {imageMigrationResults?.preview && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Info size={16} className="text-blue-600" />
                Image Scan Results
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Articles</p>
                  <p className="font-medium text-lg">{imageMigrationResults.preview.totalArticles}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Supabase Images</p>
                  <p className="font-medium text-lg text-orange-600">{imageMigrationResults.preview.supabaseImages}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Firebase Images</p>
                  <p className="font-medium text-lg text-green-600">{imageMigrationResults.preview.firebaseImages}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">No Image</p>
                  <p className="font-medium text-lg text-gray-500">{imageMigrationResults.preview.noImage}</p>
                </div>
              </div>
              {imageMigrationResults.preview.needsMigration > 0 && (
                <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                  <p className="text-orange-700 dark:text-orange-400 font-medium">
                    {imageMigrationResults.preview.needsMigration} images need migration to Firebase Storage
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Progress Display */}
          {imageMigrationRunning && imageMigrationProgress.message && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={16} className="animate-spin text-orange-600" />
                <span className="font-medium">{imageMigrationProgress.message}</span>
              </div>
              {imageMigrationProgress.total > 0 && (
                <>
                  <div className="h-2 bg-background rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${(imageMigrationProgress.current / imageMigrationProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {imageMigrationProgress.current} of {imageMigrationProgress.total} ({Math.round((imageMigrationProgress.current / imageMigrationProgress.total) * 100)}%)
                  </p>
                </>
              )}
            </div>
          )}

          {/* Migration Results */}
          {imageMigrationResults?.results && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Migration Results
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Found</p>
                  <p className="font-medium">{imageMigrationResults.results.total}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Migrated</p>
                  <p className="font-medium text-green-600">{imageMigrationResults.results.migrated}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Skipped</p>
                  <p className="font-medium text-yellow-600">{imageMigrationResults.results.skipped}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Errors</p>
                  <p className="font-medium text-red-600">{imageMigrationResults.results.errors}</p>
                </div>
              </div>
              {imageMigrationResults.results.errorDetails && imageMigrationResults.results.errorDetails.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded max-h-40 overflow-y-auto">
                  <p className="text-red-700 dark:text-red-400 font-medium mb-2">Errors:</p>
                  <ul className="text-xs text-red-600 dark:text-red-500 space-y-1">
                    {imageMigrationResults.results.errorDetails.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {imageMigrationResults.results.errorDetails.length > 10 && (
                      <li>...and {imageMigrationResults.results.errorDetails.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleImageMigrationPreview}
              disabled={imageMigrationRunning}
            >
              <Eye size={16} className="mr-2" />
              Scan Articles
            </Button>
            <Button
              onClick={() => handleImageMigrationExecute(50)}
              disabled={imageMigrationRunning}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {imageMigrationRunning ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Migrate Images (Batch 50)
                </>
              )}
            </Button>
          </div>

          {/* Important Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <p className="text-blue-700 dark:text-blue-400">
              <strong>Note:</strong> This tool requires the <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">FIREBASE_SERVICE_ACCOUNT</code> environment
              variable to be set. The migration runs in batches of 50 images at a time to avoid timeouts.
              Run multiple times until all images are migrated.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Article Status Fix Tool */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare size={20} className="text-emerald-600" />
            Fix Article Visibility
          </CardTitle>
          <CardDescription>
            Check and fix article statuses. Articles must have status &quot;published&quot; to appear on the public website.
            Imported articles may have the wrong status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Check Results */}
          {statusFixResults?.statusCounts && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Info size={16} className="text-blue-600" />
                Article Status Distribution
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Published</p>
                  <p className="font-medium text-lg text-green-600">{statusFixResults.statusCounts.published}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Draft</p>
                  <p className="font-medium text-lg text-yellow-600">{statusFixResults.statusCounts.draft}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Review</p>
                  <p className="font-medium text-lg text-blue-600">{statusFixResults.statusCounts.review}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Archived</p>
                  <p className="font-medium text-lg text-gray-500">{statusFixResults.statusCounts.archived}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Other</p>
                  <p className="font-medium text-lg text-red-500">{statusFixResults.statusCounts.other}</p>
                </div>
              </div>

              {/* Show other status values if any */}
              {statusFixResults.otherStatuses && Object.keys(statusFixResults.otherStatuses).length > 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                  <p className="text-red-700 dark:text-red-400 font-medium">Unknown statuses found:</p>
                  <ul className="text-red-600 dark:text-red-500">
                    {Object.entries(statusFixResults.otherStatuses).map(([status, count]) => (
                      <li key={status}>&quot;{status}&quot;: {count} articles</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              {statusFixResults.hiddenFromFrontend !== undefined && statusFixResults.hiddenFromFrontend > 0 && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                  <p className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {statusFixResults.hiddenFromFrontend} of {statusFixResults.total} articles are NOT visible on the public website!
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                    Click &quot;Publish All Articles&quot; to make them visible.
                  </p>
                </div>
              )}

              {statusFixResults.hiddenFromFrontend === 0 && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                    <CheckCircle size={16} />
                    All {statusFixResults.total} articles are published and visible on the website!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Update Results */}
          {statusFixResults?.updated !== undefined && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                <CheckCircle size={16} />
                Updated {statusFixResults.updated} articles to &quot;published&quot; status
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleStatusCheck}
              disabled={statusFixRunning}
            >
              {statusFixRunning ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Eye size={16} className="mr-2" />
                  Check Statuses
                </>
              )}
            </Button>
            <Button
              onClick={handleStatusFix}
              disabled={statusFixRunning || !statusFixResults?.statusCounts || statusFixResults.hiddenFromFrontend === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {statusFixRunning ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckSquare size={16} className="mr-2" />
                  Publish All Articles
                </>
              )}
            </Button>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <p className="text-blue-700 dark:text-blue-400">
              <strong>Why can&apos;t I see my articles?</strong> The public website only shows articles with status &quot;published&quot;.
              If articles were imported from Supabase with a different status (like &quot;live&quot; or &quot;active&quot;), they default to &quot;draft&quot;
              and won&apos;t appear on the frontend until published.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Categorize Tool */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder size={20} className="text-purple-600" />
            Auto-Categorize Articles
          </CardTitle>
          <CardDescription>
            Scan article titles, content, and tags to automatically assign categories (News, Sports, Business, Entertainment, Lifestyle, Outdoors).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current vs Proposed Distribution */}
          {categorizeResults?.currentDistribution && (
            <div className="p-4 bg-muted rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Distribution */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Info size={16} className="text-gray-500" />
                    Current Distribution
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(categorizeResults.currentDistribution).map(([cat, count]) => (
                      <div key={cat} className="flex justify-between items-center text-sm">
                        <span>{cat}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proposed Distribution */}
                {categorizeResults.proposedDistribution && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-500" />
                      After Auto-Categorize
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(categorizeResults.proposedDistribution).map(([cat, count]) => (
                        <div key={cat} className="flex justify-between items-center text-sm">
                          <span>{cat}</span>
                          <Badge variant="default" className="bg-purple-100 text-purple-700">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              {categorizeResults.wouldChange !== undefined && categorizeResults.wouldChange > 0 && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
                  <p className="text-purple-700 dark:text-purple-400 font-medium">
                    {categorizeResults.wouldChange} of {categorizeResults.total} articles would be re-categorized
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Update Results */}
          {categorizeResults?.updated !== undefined && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                <CheckCircle size={16} />
                Categorized {categorizeResults.updated} articles ({categorizeResults.unchanged} unchanged)
              </p>
              {categorizeResults.remaining !== undefined && categorizeResults.remaining > 0 && (
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  {categorizeResults.remaining} articles remaining - run again to continue.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCategorizePreview}
              disabled={categorizingArticles}
            >
              {categorizingArticles ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Eye size={16} className="mr-2" />
                  Preview Categories
                </>
              )}
            </Button>
            <Button
              onClick={handleCategorizeExecute}
              disabled={categorizingArticles || !categorizeResults?.wouldChange}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {categorizingArticles ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Categorizing...
                </>
              ) : (
                <>
                  <Folder size={16} className="mr-2" />
                  Auto-Categorize (Batch 200)
                </>
              )}
            </Button>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <p className="text-blue-700 dark:text-blue-400">
              <strong>How it works:</strong> Scans each article&apos;s title, slug, tags, and content for keywords
              related to each category. Articles are assigned to the best matching category based on keyword frequency.
              Run multiple batches until all articles are processed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assign Author Tool */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} className="text-teal-600" />
            Assign Article Author
          </CardTitle>
          <CardDescription>
            Bulk assign imported articles to a user. Currently imported articles show &quot;Imported Author&quot; - reassign them to give proper credit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Author Distribution */}
          {authorToolData?.authorDistribution && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Info size={16} className="text-gray-500" />
                Current Author Distribution
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm max-h-40 overflow-y-auto">
                {Object.entries(authorToolData.authorDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([author, count]) => (
                    <div key={author} className="flex justify-between items-center bg-background p-2 rounded">
                      <span className="truncate mr-2">{author}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
              {authorToolData.importedAuthorCount !== undefined && authorToolData.importedAuthorCount > 0 && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                  <p className="text-amber-700 dark:text-amber-400 font-medium">
                    {authorToolData.importedAuthorCount} articles have imported/unknown authors
                  </p>
                </div>
              )}
            </div>
          )}

          {/* User Selection */}
          {authorToolData?.users && (
            <div className="space-y-2">
              <Label>Select User to Assign Articles To</Label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={authorToolData.selectedUserId || ''}
                onChange={(e) => setAuthorToolData(prev => ({ ...prev, selectedUserId: e.target.value }))}
              >
                <option value="">-- Select a user --</option>
                {authorToolData.users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Update Results */}
          {authorToolData?.updated !== undefined && authorToolData?.assignedTo && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                <CheckCircle size={16} />
                Assigned {authorToolData.updated} articles to {authorToolData.assignedTo.name}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleLoadAuthorData}
              disabled={assigningAuthor}
            >
              {assigningAuthor ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Load Users &amp; Authors
                </>
              )}
            </Button>
            <Button
              onClick={() => handleAssignAuthor(false)}
              disabled={assigningAuthor || !authorToolData?.selectedUserId || !authorToolData?.importedAuthorCount}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {assigningAuthor ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <User size={16} className="mr-2" />
                  Assign Imported Only
                </>
              )}
            </Button>
            <Button
              onClick={() => handleAssignAuthor(true)}
              disabled={assigningAuthor || !authorToolData?.selectedUserId}
              variant="destructive"
            >
              <Users size={16} className="mr-2" />
              Assign ALL Articles
            </Button>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <p className="text-blue-700 dark:text-blue-400">
              <strong>Assign Imported Only:</strong> Only updates articles with &quot;Imported Author&quot;, &quot;Staff Writer&quot;, or no author ID.
              <br />
              <strong>Assign ALL Articles:</strong> Updates every article to the selected user (use with caution).
            </p>
          </div>
        </CardContent>
      </Card>
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
            {activeTab === 'newsletters' && <NewsletterDashboard />}
            {activeTab === 'articles' && <ArticlesAdmin />}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'infrastructure' && renderInfrastructure()}
            {activeTab === 'tools' && renderTools()}
            {activeTab === 'categories' && renderCategories()}
            {activeTab === 'comments' && <CommentAdmin />}
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

            {/* Persona Management */}
            {activeTab === 'personas' && currentUser && (
              <PersonaManager currentUserId={currentUser.uid} />
            )}

            {/* Components Section */}
            {activeTab === 'directory' && <DirectoryAdmin />}
            {activeTab === 'advertising' && <AdvertisingAdmin />}
            {activeTab === 'blog' && <BlogAdmin />}
            {activeTab === 'events' && <EventsAdmin />}
            {activeTab === 'community' && <CommunityAdmin />}

            {/* Menus Management */}
            {activeTab === 'menus' && <MenuManager />}

            {/* Site Configuration */}
            {activeTab === 'site-config' && <SiteConfigManager />}

            {/* Credits & Billing */}
            {activeTab === 'credits' && <CreditsDashboard />}

            {/* AI Configuration */}
            {activeTab === 'ai-config' && <AIConfigurator />}

            {/* Paper Partner Admin - Super Admin Only */}
            {activeTab === 'paper-partners' && <PaperPartnerAdmin />}

            {/* Module Manager */}
            {activeTab === 'modules' && <ModuleManager />}

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
