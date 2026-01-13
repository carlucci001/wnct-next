'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Sidebar as SidebarIcon,
  Image as ImageIcon,
  Newspaper,
  Calendar,
  Users,
  MessageSquare,
  MapPin,
  FileText,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react';

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
  },

  // Article Page Positions
  {
    id: 'article-header',
    name: 'Article Header',
    position: 'ARTICLE_HEADER',
    component: 'ArticleClient',
    page: 'Article',
    category: 'article',
    status: 'active',
    description: 'Article metadata and title',
  },
  {
    id: 'article-featured-image',
    name: 'Featured Image',
    position: 'ARTICLE_FEATURED_IMAGE',
    component: 'ArticleClient',
    page: 'Article',
    category: 'article',
    status: 'active',
    description: 'Article hero image',
  },
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
  },
  {
    id: 'article-related',
    name: 'Related Articles',
    position: 'ARTICLE_RELATED',
    component: 'ArticleClient',
    page: 'Article',
    category: 'article',
    status: 'active',
    description: 'Related content grid',
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
  },

  // Blog Page Positions
  {
    id: 'blog-grid',
    name: 'Blog Grid',
    position: 'BLOG_GRID',
    component: 'BlogGrid',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Blog post card grid',
  },
  {
    id: 'blog-sidebar-search',
    name: 'Blog Search',
    position: 'BLOG_SIDEBAR_SEARCH',
    component: 'BlogSidebar',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Search widget',
  },
  {
    id: 'blog-sidebar-author',
    name: 'Author Bio',
    position: 'BLOG_SIDEBAR_AUTHOR',
    component: 'BlogSidebar',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Author bio card (context-aware)',
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
  },
  {
    id: 'blog-sidebar-recent',
    name: 'Recent Posts',
    position: 'BLOG_SIDEBAR_RECENT',
    component: 'BlogSidebar',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Recent posts list',
  },
  {
    id: 'blog-sidebar-tags',
    name: 'Popular Tags',
    position: 'BLOG_SIDEBAR_TAGS',
    component: 'BlogSidebar',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Topics tag cloud',
  },
  {
    id: 'blog-sidebar-quote',
    name: 'Featured Quote',
    position: 'BLOG_SIDEBAR_QUOTE',
    component: 'BlogSidebar',
    page: 'Blog',
    category: 'blog',
    status: 'active',
    description: 'Featured quote widget',
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
  },

  // Directory Page Positions
  {
    id: 'directory-search',
    name: 'Directory Search',
    position: 'DIRECTORY_SEARCH',
    component: 'DirectoryClient',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Search and filter bar',
  },
  {
    id: 'directory-grid',
    name: 'Business Grid',
    position: 'DIRECTORY_GRID',
    component: 'DirectoryClient',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Business cards grid',
  },
  {
    id: 'directory-sidebar-map',
    name: 'Business Map',
    position: 'DIRECTORY_SIDEBAR_MAP',
    component: 'DirectorySidebar',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Interactive business map',
  },
  {
    id: 'directory-sidebar-featured',
    name: 'Featured Businesses',
    position: 'DIRECTORY_SIDEBAR_FEATURED',
    component: 'DirectorySidebar',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Top rated businesses (max 4)',
  },
  {
    id: 'directory-sidebar-categories',
    name: 'Category Badges',
    position: 'DIRECTORY_SIDEBAR_CATEGORIES',
    component: 'DirectorySidebar',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Category filter badges',
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
  },
  {
    id: 'directory-sidebar-areas',
    name: 'Neighborhoods',
    position: 'DIRECTORY_SIDEBAR_AREAS',
    component: 'DirectorySidebar',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Area/neighborhood selector',
  },
  {
    id: 'directory-sidebar-cta',
    name: 'Business Promo',
    position: 'DIRECTORY_SIDEBAR_CTA',
    component: 'DirectorySidebar',
    page: 'Directory',
    category: 'directory',
    status: 'active',
    description: 'Business promotion card',
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
  },

  // Events Page Positions
  {
    id: 'events-filters',
    name: 'Event Filters',
    position: 'EVENTS_FILTERS',
    component: 'EventsClient',
    page: 'Events',
    category: 'events',
    status: 'active',
    description: 'Category and search filters',
  },
  {
    id: 'events-list',
    name: 'Events List',
    position: 'EVENTS_LIST',
    component: 'EventsClient',
    page: 'Events',
    category: 'events',
    status: 'active',
    description: 'Event cards or calendar view',
  },
  {
    id: 'events-sidebar-cta',
    name: 'Submit Event',
    position: 'EVENTS_SIDEBAR_CTA',
    component: 'EventsSidebar',
    page: 'Events',
    category: 'events',
    status: 'active',
    description: 'Submit event CTA card',
  },
  {
    id: 'events-sidebar-calendar',
    name: 'Mini Calendar',
    position: 'EVENTS_SIDEBAR_CALENDAR',
    component: 'EventsSidebar',
    page: 'Events',
    category: 'events',
    status: 'active',
    description: 'Mini calendar widget',
  },
  {
    id: 'events-sidebar-upcoming',
    name: 'Upcoming Events',
    position: 'EVENTS_SIDEBAR_UPCOMING',
    component: 'EventsSidebar',
    page: 'Events',
    category: 'events',
    status: 'active',
    description: 'Upcoming events list (max 5)',
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
  },

  // Community Page Positions
  {
    id: 'community-create-post',
    name: 'Create Post',
    position: 'COMMUNITY_CREATE_POST',
    component: 'CommunityClient',
    page: 'Community',
    category: 'community',
    status: 'active',
    description: 'Create post widget',
  },
  {
    id: 'community-feed',
    name: 'Community Feed',
    position: 'COMMUNITY_FEED',
    component: 'CommunityClient',
    page: 'Community',
    category: 'community',
    status: 'active',
    description: 'Post cards feed',
  },
  {
    id: 'community-sidebar-filters',
    name: 'Topic Filters',
    position: 'COMMUNITY_SIDEBAR_FILTERS',
    component: 'CommunitySidebar',
    page: 'Community',
    category: 'community',
    status: 'active',
    description: 'Topic quick filters',
  },
  {
    id: 'community-sidebar-trending',
    name: 'Trending Posts',
    position: 'COMMUNITY_SIDEBAR_TRENDING',
    component: 'CommunitySidebar',
    page: 'Community',
    category: 'community',
    status: 'active',
    description: 'Top 5 trending posts',
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
  },
  {
    id: 'community-sidebar-guidelines',
    name: 'Community Guidelines',
    position: 'COMMUNITY_SIDEBAR_GUIDELINES',
    component: 'CommunitySidebar',
    page: 'Community',
    category: 'community',
    status: 'active',
    description: 'Community rules',
  },
  {
    id: 'community-sidebar-cta',
    name: 'Join CTA',
    position: 'COMMUNITY_SIDEBAR_CTA',
    component: 'CommunitySidebar',
    page: 'Community',
    category: 'community',
    status: 'active',
    description: 'Join conversation CTA (logged-out)',
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
  },
  {
    id: 'footer-about',
    name: 'Footer About',
    position: 'FOOTER_ABOUT',
    component: 'Footer',
    page: 'All Pages',
    category: 'footer',
    status: 'active',
    description: 'About section',
  },
  {
    id: 'footer-links',
    name: 'Footer Links',
    position: 'FOOTER_LINKS',
    component: 'Footer',
    page: 'All Pages',
    category: 'footer',
    status: 'active',
    description: 'Quick links column',
  },
  {
    id: 'footer-categories',
    name: 'Footer Categories',
    position: 'FOOTER_CATEGORIES',
    component: 'Footer',
    page: 'All Pages',
    category: 'footer',
    status: 'active',
    description: 'Categories column',
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
  },
  {
    id: 'footer-copyright',
    name: 'Copyright Bar',
    position: 'FOOTER_COPYRIGHT',
    component: 'Footer',
    page: 'All Pages',
    category: 'footer',
    status: 'active',
    description: 'Copyright information',
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

  const filteredModules = MODULE_DATA.filter((module) => {
    const matchesSearch =
      searchQuery === '' ||
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || module.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const modulesByCategory = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, ModulePosition[]>);

  const statusCount = {
    active: MODULE_DATA.filter((m) => m.status === 'active').length,
    inactive: MODULE_DATA.filter((m) => m.status === 'inactive').length,
    reserved: MODULE_DATA.filter((m) => m.status === 'reserved').length,
  };

  const advertisingModules = MODULE_DATA.filter((m) => m.component === 'AdDisplay');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{MODULE_DATA.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statusCount.active}</div>
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {Object.keys(modulesByCategory).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Module Registry</CardTitle>
          <CardDescription>
            View and manage all system module positions across the site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules by name, position, or component..."
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
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
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {module.status === 'active' && (
                        <Eye className="h-5 w-5 text-green-600" />
                      )}
                      {module.status === 'inactive' && (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      )}
                      {module.status === 'reserved' && (
                        <Plug className="h-5 w-5 text-yellow-600" />
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
                ))}
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
