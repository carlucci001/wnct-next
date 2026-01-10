'use client';

import {
  LayoutDashboard, FileText, Settings, Users,
  ListOrdered, Image as ImageIcon, Shield,
  Sparkles, ChevronDown, PenTool, CheckCircle, Search, Share2, ShieldAlert,
  Plug, Server, Building2, Megaphone, BookOpen, CalendarDays, Boxes, Package, Bot, X, MessageSquare, Wrench, Menu, Coins, Newspaper, UserCircle2, Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessSuperAdmin } from '@/config/masterSite';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'articles' | 'categories' | 'comments' | 'media' | 'users' | 'personas' | 'roles' | 'settings' | 'api-config' | 'infrastructure' | 'tools' | 'MASTER' | 'JOURNALIST' | 'EDITOR' | 'SEO' | 'SOCIAL' | 'GEO' | 'directory' | 'advertising' | 'blog' | 'events' | 'modules' | 'ai-journalists' | 'my-account' | 'community' | 'menus' | 'site-config' | 'credits' | 'paper-partners';

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

interface AdminSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  menuSections: MenuSections;
  toggleMenuSection: (section: keyof MenuSections) => void;
  onClearChat: () => void;
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

const NavItem = ({
  active,
  onClick,
  icon: Icon,
  iconColor,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
}) => (
  <Button
    variant={active ? "secondary" : "ghost"}
    className={cn(
      "w-full justify-start gap-3 font-medium",
      active && "bg-primary/10 text-primary hover:bg-primary/15"
    )}
    onClick={onClick}
  >
    <Icon size={16} className={iconColor} />
    {children}
  </Button>
);

const SectionHeader = ({
  title,
  icon: Icon,
  iconColor,
  isOpen
}: {
  title: string;
  icon?: React.ElementType;
  iconColor?: string;
  isOpen: boolean;
}) => (
  <div className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 py-1 hover:text-foreground transition-colors rounded-md hover:bg-muted/50 cursor-pointer">
    <span className="flex items-center gap-2">
      {Icon && <Icon size={12} className={iconColor} />}
      {title}
    </span>
    <ChevronDown
      size={14}
      className={cn(
        "transition-transform duration-200",
        !isOpen && "-rotate-90"
      )}
    />
  </div>
);

export function AdminSidebar({
  activeTab,
  setActiveTab,
  menuSections,
  toggleMenuSection,
  onClearChat,
  mobileMenuOpen,
  onMobileMenuClose
}: AdminSidebarProps) {
  const { currentUser } = useAuth();
  const showPaperPartnerAdmin = canAccessSuperAdmin(currentUser?.uid);


  const sidebarContent = (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-4 pb-8">
          {/* Dashboard */}
          <div>
            <NavItem
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={LayoutDashboard}
            >
              Dashboard
            </NavItem>
          </div>

          <Separator />

          {/* AI Workforce Section */}
          <Collapsible open={menuSections.ai} onOpenChange={() => toggleMenuSection('ai')}>
            <CollapsibleTrigger className="w-full">
              <SectionHeader
                title="AI Workforce"
                icon={Sparkles}
                iconColor="text-purple-500"
                isOpen={menuSections.ai}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                active={activeTab === 'MASTER'}
                onClick={() => { setActiveTab('MASTER'); onClearChat(); }}
                icon={ShieldAlert}
                iconColor="text-indigo-600"
              >
                Editor-in-Chief
              </NavItem>
              <NavItem
                active={activeTab === 'EDITOR'}
                onClick={() => { setActiveTab('EDITOR'); onClearChat(); }}
                icon={CheckCircle}
                iconColor="text-green-600"
              >
                Editor
              </NavItem>
              <NavItem
                active={activeTab === 'JOURNALIST'}
                onClick={() => { setActiveTab('JOURNALIST'); onClearChat(); }}
                icon={PenTool}
                iconColor="text-blue-600"
              >
                Journalist
              </NavItem>
              <NavItem
                active={activeTab === 'SEO'}
                onClick={() => { setActiveTab('SEO'); onClearChat(); }}
                icon={Search}
                iconColor="text-purple-600"
              >
                SEO Specialist
              </NavItem>
              <NavItem
                active={activeTab === 'SOCIAL'}
                onClick={() => { setActiveTab('SOCIAL'); onClearChat(); }}
                icon={Share2}
                iconColor="text-pink-600"
              >
                Social Media
              </NavItem>
              <NavItem
                active={activeTab === 'GEO'}
                onClick={() => { setActiveTab('GEO'); onClearChat(); }}
                icon={Globe}
                iconColor="text-teal-600"
              >
                GEO Specialist
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Content Section */}
          <Collapsible open={menuSections.content} onOpenChange={() => toggleMenuSection('content')}>
            <CollapsibleTrigger className="w-full">
              <SectionHeader
                title="Content"
                icon={FileText}
                iconColor="text-blue-500"
                isOpen={menuSections.content}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                active={activeTab === 'articles'}
                onClick={() => setActiveTab('articles')}
                icon={FileText}
              >
                Articles
              </NavItem>
              <NavItem
                active={activeTab === 'categories'}
                onClick={() => setActiveTab('categories')}
                icon={ListOrdered}
              >
                Categories
              </NavItem>
              <NavItem
                active={activeTab === 'comments'}
                onClick={() => setActiveTab('comments')}
                icon={MessageSquare}
              >
                Comments
              </NavItem>
              <NavItem
                active={activeTab === 'media'}
                onClick={() => setActiveTab('media')}
                icon={ImageIcon}
              >
                Media Library
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Components Section */}
          <Collapsible open={menuSections.components} onOpenChange={() => toggleMenuSection('components')}>
            <CollapsibleTrigger className="w-full">
              <SectionHeader
                title="Components"
                icon={Boxes}
                iconColor="text-orange-500"
                isOpen={menuSections.components}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                active={activeTab === 'directory'}
                onClick={() => setActiveTab('directory')}
                icon={Building2}
                iconColor="text-blue-600"
              >
                Directory
              </NavItem>
              <NavItem
                active={activeTab === 'advertising'}
                onClick={() => setActiveTab('advertising')}
                icon={Megaphone}
                iconColor="text-green-600"
              >
                Advertising
              </NavItem>
              <NavItem
                active={activeTab === 'blog'}
                onClick={() => setActiveTab('blog')}
                icon={BookOpen}
                iconColor="text-purple-600"
              >
                Blog
              </NavItem>
              <NavItem
                active={activeTab === 'events'}
                onClick={() => setActiveTab('events')}
                icon={CalendarDays}
                iconColor="text-pink-600"
              >
                Events
              </NavItem>
              <NavItem
                active={activeTab === 'community'}
                onClick={() => setActiveTab('community')}
                icon={MessageSquare}
                iconColor="text-teal-600"
              >
                Community
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Navigation Section */}
          <Collapsible open={menuSections.navigation} onOpenChange={() => toggleMenuSection('navigation')}>
            <CollapsibleTrigger className="w-full">
              <SectionHeader
                title="Navigation"
                icon={Menu}
                iconColor="text-indigo-500"
                isOpen={menuSections.navigation}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                active={activeTab === 'menus'}
                onClick={() => setActiveTab('menus')}
                icon={Menu}
                iconColor="text-indigo-600"
              >
                Menu Manager
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Modules Section */}
          <Collapsible open={menuSections.modules} onOpenChange={() => toggleMenuSection('modules')}>
            <CollapsibleTrigger className="w-full">
              <SectionHeader
                title="Modules"
                icon={Package}
                iconColor="text-cyan-500"
                isOpen={menuSections.modules}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                active={activeTab === 'modules'}
                onClick={() => setActiveTab('modules')}
                icon={Package}
                iconColor="text-cyan-600"
              >
                Module Manager
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Plugins Section */}
          <Collapsible open={menuSections.plugins} onOpenChange={() => toggleMenuSection('plugins')}>
            <CollapsibleTrigger className="w-full">
              <SectionHeader
                title="Plugins"
                icon={Plug}
                iconColor="text-amber-500"
                isOpen={menuSections.plugins}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                active={activeTab === 'api-config'}
                onClick={() => setActiveTab('api-config')}
                icon={Plug}
                iconColor="text-amber-600"
              >
                APIs
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Users Section */}
          <Collapsible open={menuSections.users} onOpenChange={() => toggleMenuSection('users')}>
            <CollapsibleTrigger className="w-full">
              <SectionHeader
                title="Users & Roles"
                icon={Users}
                iconColor="text-green-500"
                isOpen={menuSections.users}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                icon={Users}
              >
                User Management
              </NavItem>
              <NavItem
                active={activeTab === 'personas'}
                onClick={() => setActiveTab('personas')}
                icon={UserCircle2}
                iconColor="text-violet-600"
              >
                Persona Management
              </NavItem>
              <NavItem
                active={activeTab === 'roles'}
                onClick={() => setActiveTab('roles')}
                icon={Shield}
              >
                Roles & Permissions
              </NavItem>
              <NavItem
                active={activeTab === 'ai-journalists'}
                onClick={() => setActiveTab('ai-journalists')}
                icon={Bot}
                iconColor="text-cyan-600"
              >
                Agent Manager
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* System Settings Section */}
          <Collapsible open={menuSections.systemSettings} onOpenChange={() => toggleMenuSection('systemSettings')}>
            <CollapsibleTrigger className="w-full">
              <SectionHeader
                title="System"
                icon={Settings}
                iconColor="text-slate-500"
                isOpen={menuSections.systemSettings}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <NavItem
                active={activeTab === 'site-config'}
                onClick={() => setActiveTab('site-config')}
                icon={Building2}
                iconColor="text-emerald-600"
              >
                Site Configuration
              </NavItem>
              <NavItem
                active={activeTab === 'credits'}
                onClick={() => setActiveTab('credits')}
                icon={Coins}
                iconColor="text-amber-500"
              >
                Credits & Billing
              </NavItem>
              <NavItem
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                icon={Settings}
              >
                Site Settings
              </NavItem>
              <NavItem
                active={activeTab === 'infrastructure'}
                onClick={() => setActiveTab('infrastructure')}
                icon={Server}
              >
                Infrastructure
              </NavItem>
              <NavItem
                active={activeTab === 'tools'}
                onClick={() => setActiveTab('tools')}
                icon={Wrench}
                iconColor="text-amber-600"
              >
                Tools
              </NavItem>
            </CollapsibleContent>
          </Collapsible>

          {/* Paper Partner Admin - Super Admin Only */}
          {showPaperPartnerAdmin && (
            <>
              <Separator />
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 py-1 flex items-center gap-2">
                  <Newspaper size={12} className="text-red-500" />
                  <span>Paper Partner Admin</span>
                </div>
                <NavItem
                  active={activeTab === 'paper-partners'}
                  onClick={() => setActiveTab('paper-partners')}
                  icon={ShieldAlert}
                  iconColor="text-red-600"
                >
                  Manage Partners
                </NavItem>
              </div>
            </>
          )}
        </div>
    </ScrollArea>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-card flex flex-col transform transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ top: '64px' }} // Below header
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-sm">Navigation</span>
          <Button variant="ghost" size="icon" onClick={onMobileMenuClose} className="h-8 w-8">
            <X size={18} />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card flex-col h-full min-h-0">
        {sidebarContent}
      </aside>
    </>
  );
}
