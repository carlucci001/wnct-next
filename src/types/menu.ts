// Menu system types

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
  order: number;
  icon?: string; // Optional lucide icon name
  openInNewTab?: boolean;
}

export interface SiteMenu {
  id: string;
  name: string;
  slug: string; // e.g., 'top-nav', 'main-nav'
  description?: string;
  items: MenuItem[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default menus matching the current Header
export const DEFAULT_MENUS: SiteMenu[] = [
  {
    id: 'top-nav',
    name: 'Top Navigation',
    slug: 'top-nav',
    description: 'Links in the top bar (Home, Advertise, Directory, etc.)',
    items: [
      { id: 'home', label: 'Home', path: '/', enabled: true, order: 0 },
      { id: 'advertise', label: 'Advertise', path: '/advertise', enabled: true, order: 1 },
      { id: 'directory', label: 'Directory', path: '/directory', enabled: true, order: 2 },
      { id: 'blog', label: 'Blog', path: '/blog', enabled: true, order: 3 },
      { id: 'events', label: 'Events', path: '/events', enabled: true, order: 4 },
      { id: 'community', label: 'Community', path: '/community', enabled: true, order: 5 },
      { id: 'contact', label: 'Contact', path: '/contact', enabled: true, order: 6 },
    ],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'main-nav',
    name: 'Main Navigation',
    slug: 'main-nav',
    description: 'Category links in the main navigation bar',
    items: [
      { id: 'news', label: 'News', path: '/category/news', enabled: true, order: 0 },
      { id: 'sports', label: 'Sports', path: '/category/sports', enabled: true, order: 1 },
      { id: 'business', label: 'Business', path: '/category/business', enabled: true, order: 2 },
      { id: 'entertainment', label: 'Entertainment', path: '/category/entertainment', enabled: true, order: 3 },
      { id: 'lifestyle', label: 'Lifestyle', path: '/category/lifestyle', enabled: true, order: 4 },
      { id: 'outdoors', label: 'Outdoors', path: '/category/outdoors', enabled: true, order: 5 },
    ],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
