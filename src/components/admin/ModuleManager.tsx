'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plug,
  Search,
  Layers,
  Layout,
  Image as ImageIcon,
  Newspaper,
  Calendar,
  Users,
  MapPin,
  FileText,
  Globe,
  Eye,
  EyeOff,
  Settings,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type ModuleStatus = 'active' | 'inactive' | 'reserved';

interface ModulePosition {
  id: string;
  name: string;
  position: string;
  component: string;
  page: string;
  category: string;
  status: ModuleStatus;
  description: string;
  dimensions?: string;
  configurable: boolean;
}

interface ModuleConfigs {
  [moduleId: string]: {
    enabled: boolean;
    settings?: Record<string, any>;
  };
}

const MODULE_DATA: ModulePosition[] = [
  // Header Positions
  {
    id: 'header-weather',
    name: 'Weather Widget',
    position: 'HEADER_WEATHER',
    component: 'WeatherWidget',
    page: 'All Pages',
    category: 'header',
    status: 'active',
    description: 'Dynamic weather display with location detection',
    configurable: true,
  },
  {
    id: 'header-ad-primary',
    name: 'Header Banner Ad',
    position: 'HEADER_AD_PRIMARY',
    component: 'AdDisplay',
    page: 'All Pages',
    category: 'header',
    status: 'active',
    description: 'Main header banner advertisement',
    dimensions: '728x90',
    configurable: true,
  },
  {
    id: 'header-nav-dynamic',
    name: 'Dynamic Navigation',
    position: 'HEADER_NAV_DYNAMIC',
    component: 'Header',
    page: 'All Pages',
    category: 'header',
    status: 'active',
    description: 'API-driven navigation menus',
    configurable: false,
  },

  // Home Page Positions
  {
    id: 'home-hero',
    name: 'Hero Section',
    position: 'HOME_HERO',
    component: 'HeroSection',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Featured articles carousel',
    configurable: true,
  },
  {
    id: 'home-feed-inline-1',
    name: 'Feed Inline Ad',
    position: 'HOME_FEED_INLINE_1',
    component: 'AdDisplay',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Ad between featured sections',
    dimensions: 'Adaptive',
    configurable: true,
  },
  {
    id: 'home-sidebar-1',
    name: 'Sidebar Top Ad',
    position: 'HOME_SIDEBAR_RIGHT_1',
    component: 'AdDisplay',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Sidebar top advertisement',
    dimensions: '300x250',
    configurable: true,
  },
  {
    id: 'home-sidebar-2',
    name: 'Trending Articles',
    position: 'HOME_SIDEBAR_RIGHT_2',
    component: 'Sidebar',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Trending articles widget',
    configurable: true,
  },
  {
    id: 'home-sidebar-3',
    name: 'Categories Widget',
    position: 'HOME_SIDEBAR_RIGHT_3',
    component: 'Sidebar',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Category navigation links',
    configurable: true,
  },
  {
    id: 'home-sidebar-4',
    name: 'Upcoming Events',
    position: 'HOME_SIDEBAR_RIGHT_4',
    component: 'Sidebar',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Events preview widget',
    configurable: true,
  },
  {
    id: 'home-sidebar-5',
    name: 'Newsletter Signup',
    position: 'HOME_SIDEBAR_RIGHT_5',
    component: 'Sidebar',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Newsletter subscription form',
    configurable: true,
  },
  {
    id: 'home-sidebar-6',
    name: 'Most Popular',
    position: 'HOME_SIDEBAR_RIGHT_6',
    component: 'Sidebar',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Most popular articles widget',
    configurable: true,
  },
  {
    id: 'home-sidebar-7',
    name: 'Sidebar Sticky Ad',
    position: 'HOME_SIDEBAR_RIGHT_7',
    component: 'AdDisplay',
    page: 'Home',
    category: 'home',
    status: 'active',
    description: 'Sticky sidebar advertisement',
    dimensions: '300x600',
    configurable: true,
  },

  // Article Page Positions
  {
    id: 'article-inline',
    name: 'In-Article Ad',
    position: 'ARTICLE_CONTENT_INLINE',
    component: 'AdDisplay',
    page: 'Article',
    category: 'article',
    status: 'active',
    description: 'Ad injected mid-article',
    dimensions: 'Adaptive',
    configurable: true,
  },
  {
    id: 'article-sidebar-top',
    name: 'Article Sidebar Top Ad',
    position: 'ARTICLE_SIDEBAR_TOP',
    component: 'AdDisplay',
    page: 'Article',
    category: 'article',
    status: 'active',
    description: 'Sidebar top advertisement',
    dimensions: '300x250',
    configurable: true,
  },
  {
    id: 'article-sidebar-sticky',
    name: 'Article Sidebar Sticky Ad',
    position: 'ARTICLE_SIDEBAR_STICKY',
    component: 'AdDisplay',
    page: 'Article',
    category: 'article',
    status: 'active',
    description: 'Sticky sidebar advertisement',
    dimensions: '300x600',
    configurable: true,
  },
  {
    id: 'article-comments',
    name: 'Comments Section',
    position: 'ARTICLE_COMMENTS',
    component: 'CommentSection',
    page: 'Article',
    category: 'article',
    status: 'active',
    description: 'User comments and discussion',
    configurable: true,
  },

  // Blog Page Positions
  {
    id: 'blog-sidebar-search',
    name: 'Blog Search',
    position: 'BLOG_SIDEBAR_SEARCH',
    component: 'BlogSidebar',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Search widget',
    configurable: true,
  },
  {
    id: 'blog-sidebar-newsletter',
    name: 'Blog Newsletter',
    position: 'BLOG_SIDEBAR_NEWSLETTER',
    component: 'BlogSidebar',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Newsletter signup',
    configurable: true,
  },
  {
    id: 'blog-sidebar-sticky',
    name: 'Blog Sidebar Ad',
    position: 'BLOG_SIDEBAR_STICKY',
    component: 'AdDisplay',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Sticky sidebar advertisement',
    dimensions: '300x600',
    configurable: true,
  },

  // Directory Page Positions
  {
    id: 'directory-sidebar-map',
    name: 'Business Map',
    position: 'DIRECTORY_SIDEBAR_MAP',
    component: 'DirectorySidebar',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Interactive business map',
    configurable: true,
  },
  {
    id: 'directory-sidebar-ad-top',
    name: 'Directory Top Ad',
    position: 'DIRECTORY_SIDEBAR_AD_TOP',
    component: 'AdDisplay',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Sidebar top advertisement',
    dimensions: '300x250',
    configurable: true,
  },
  {
    id: 'directory-sidebar-sticky',
    name: 'Directory Sticky Ad',
    position: 'DIRECTORY_SIDEBAR_STICKY',
    component: 'AdDisplay',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Sticky sidebar advertisement',
    dimensions: '300x600',
    configurable: true,
  },

  // Events Page Positions
  {
    id: 'events-sidebar-calendar',
    name: 'Mini Calendar',
    position: 'EVENTS_SIDEBAR_CALENDAR',
    component: 'EventsSidebar',
    page: 'Events',
    category: 'events',
    status: 'active',
    description: 'Mini calendar widget',
    configurable: true,
  },
  {
    id: 'events-sidebar-ad',
    name: 'Events Sidebar Ad',
    position: 'EVENTS_SIDEBAR_AD',
    component: 'AdDisplay',
    page: 'Events',
    category: 'events',
    status: 'active',
    description: 'Sidebar top advertisement',
    dimensions: '300x250',
    configurable: true,
  },

  // Community Page Positions
  {
    id: 'community-sidebar-trending',
    name: 'Trending Posts',
    position: 'COMMUNITY_SIDEBAR_TRENDING',
    component: 'CommunitySidebar',
    page: 'Community',
    category: 'community',
    status: 'active',
    description: 'Top 5 trending posts',
    configurable: true,
  },
  {
    id: 'community-sidebar-stats',
    name: 'Community Stats',
    position: 'COMMUNITY_SIDEBAR_STATS',
    component: 'CommunitySidebar',
    page: 'Community',
    category: 'community',
    status: 'active',
    description: 'Total/weekly/active stats',
    configurable: true,
  },

  // Footer Positions
  {
    id: 'footer-ad-wide',
    name: 'Footer Banner Ad',
    position: 'FOOTER_AD_WIDE',
    component: 'AdDisplay',
    page: 'All Pages',
    category: 'footer',
    status: 'active',
    description: 'Footer wide banner advertisement',
    dimensions: '970x90',
    configurable: true,
  },
  {
    id: 'footer-newsletter',
    name: 'Footer Newsletter',
    position: 'FOOTER_NEWSLETTER',
    component: 'Footer',
    page: 'All Pages',
    category: 'footer',
    status: 'active',
    description: 'Newsletter signup',
    configurable: true,
  },

  // Global Positions
  {
    id: 'global-breaking-news',
    name: 'Breaking News Ticker',
    position: 'GLOBAL_BREAKING_NEWS',
    component: 'BreakingNews',
    page: 'All Pages',
    category: 'global',
    status: 'active',
    description: 'Breaking news ticker',
    configurable: true,
  },
  {
    id: 'global-chat-assistant',
    name: 'Chat Assistant',
    position: 'GLOBAL_CHAT_ASSISTANT',
    component: 'ChatAssistant',
    page: 'All Pages',
    category: 'global',
    status: 'active',
    description: 'Chat widget (bottom-right)',
    configurable: true,
  },
  {
    id: 'global-popup-overlay',
    name: 'Popup Overlay Ad',
    position: 'GLOBAL_POPUP_OVERLAY',
    component: 'AdDisplay',
    page: 'All Pages',
    category: 'global',
    status: 'reserved',
    description: 'Modal overlay ads (special campaigns)',
    dimensions: '800x600',
    configurable: true,
  },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  header: Layout,
  home: Newspaper,
  article: FileText,
  blog: Newspaper,
  directory: MapPin,
  events: Calendar,
  community: Users,
  footer: Layers,
  global: Globe,
};

const CATEGORY_LABELS: Record<string, string> = {
  header: 'Header',
  home: 'Home Page',
  article: 'Article Pages',
  blog: 'Blog Pages',
  directory: 'Directory',
  events: 'Events',
  community: 'Community',
  footer: 'Footer',
  global: 'Global',
};

export default function ModuleManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfigs>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load module configurations from Firestore
  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      setLoading(true);
      const docRef = doc(getDb(), 'settings', 'modules');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setModuleConfigs(docSnap.data() as ModuleConfigs);
      } else {
        // Initialize with all modules enabled by default
        const defaultConfigs: ModuleConfigs = {};
        MODULE_DATA.forEach((module) => {
          defaultConfigs[module.id] = {
            enabled: module.status === 'active',
            settings: {},
          };
        });
        setModuleConfigs(defaultConfigs);
      }
    } catch (error) {
      console.error('Error loading module configs:', error);
      toast.error('Failed to load module configurations');
    } finally {
      setLoading(false);
    }
  }

  async function saveConfigs() {
    try {
      setSaving(true);
      const docRef = doc(getDb(), 'settings', 'modules');
      await setDoc(docRef, moduleConfigs);
      toast.success('Module configurations saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving module configs:', error);
      toast.error('Failed to save module configurations');
    } finally {
      setSaving(false);
    }
  }

  function toggleModule(moduleId: string) {
    setModuleConfigs((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        enabled: !prev[moduleId]?.enabled,
      },
    }));
    setHasChanges(true);
  }

  function isModuleEnabled(moduleId: string): boolean {
    return moduleConfigs[moduleId]?.enabled ?? true;
  }

  const filteredModules = MODULE_DATA.filter((module) => {
    const matchesSearch =
      searchQuery === '' ||
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;

    // Filter by enabled/disabled status
    if (selectedStatus === 'enabled') {
      return matchesSearch && matchesCategory && isModuleEnabled(module.id);
    }
    if (selectedStatus === 'disabled') {
      return matchesSearch && matchesCategory && !isModuleEnabled(module.id);
    }

    return matchesSearch && matchesCategory;
  });

  const modulesByCategory = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, ModulePosition[]>);

  const statusCount = {
    total: MODULE_DATA.length,
    enabled: Object.values(moduleConfigs).filter((c) => c.enabled).length,
    disabled: Object.values(moduleConfigs).filter((c) => !c.enabled).length,
  };

  const advertisingModules = MODULE_DATA.filter((m) => m.component === 'AdDisplay');
  const configurableModules = MODULE_DATA.filter((m) => m.configurable);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading module configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Bar */}
      {hasChanges && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    You have unsaved changes
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Save your module configuration changes to apply them
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadConfigs} disabled={saving}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={saveConfigs} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCount.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statusCount.enabled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{statusCount.disabled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Advertising</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{advertisingModules.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Module Registry & Controls</CardTitle>
          <CardDescription>
            Enable/disable module positions and view configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="home">Home Page</SelectItem>
                <SelectItem value="article">Article Pages</SelectItem>
                <SelectItem value="blog">Blog Pages</SelectItem>
                <SelectItem value="directory">Directory</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="enabled">Enabled Only</SelectItem>
                <SelectItem value="disabled">Disabled Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            Showing {filteredModules.length} of {MODULE_DATA.length} modules
          </div>
        </CardContent>
      </Card>

      {/* Module List by Category */}
      {Object.entries(modulesByCategory).map(([category, modules]) => {
        const Icon = CATEGORY_ICONS[category] || Plug;
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {CATEGORY_LABELS[category] || category}
                <Badge variant="secondary" className="ml-2">
                  {modules.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Module positions for {CATEGORY_LABELS[category]?.toLowerCase() || category}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modules.map((module) => {
                  const enabled = isModuleEnabled(module.id);
                  return (
                    <div
                      key={module.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                        enabled ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {module.configurable ? (
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => toggleModule(module.id)}
                            aria-label={`Toggle ${module.name}`}
                          />
                        ) : (
                          <div className="w-10 h-6 flex items-center justify-center">
                            {enabled ? (
                              <Eye className="h-5 w-5 text-green-600" />
                            ) : (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{module.name}</h4>
                          {module.component === 'AdDisplay' && (
                            <Badge variant="outline" className="text-xs">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Ad
                            </Badge>
                          )}
                          {module.status === 'reserved' && (
                            <Badge variant="secondary" className="text-xs">
                              Reserved
                            </Badge>
                          )}
                          {module.dimensions && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {module.dimensions}
                            </Badge>
                          )}
                          {!module.configurable && (
                            <Badge variant="outline" className="text-xs">
                              System
                            </Badge>
                          )}
                          {!enabled && (
                            <Badge variant="destructive" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-muted rounded font-mono">
                            {module.position}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">
                            {module.component}
                          </span>
                          <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded">
                            {module.page}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {filteredModules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No modules found matching your filters</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
