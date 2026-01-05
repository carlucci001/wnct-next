'use client';

import {
  LayoutDashboard, FileText, Settings, Users,
  ListOrdered, Image as ImageIcon, Shield,
  Sparkles, ChevronDown, PenTool, CheckCircle, Search, Share2, ShieldAlert,
  Plug, Server, Building2, Megaphone, BookOpen, CalendarDays, Boxes, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'articles' | 'categories' | 'media' | 'users' | 'roles' | 'settings' | 'api-config' | 'infrastructure' | 'MASTER' | 'JOURNALIST' | 'EDITOR' | 'SEO' | 'SOCIAL' | 'directory' | 'advertising' | 'blog' | 'events' | 'modules';

interface MenuSections {
  ai: boolean;
  content: boolean;
  components: boolean;
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
  onClearChat
}: AdminSidebarProps) {
  // Accordion behavior: close other sections when opening a new one
  const handleSectionToggle = (section: keyof MenuSections) => {
    // Only allow one section open at a time
    toggleMenuSection(section);
  };

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-full min-h-0">
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
                active={activeTab === 'JOURNALIST'}
                onClick={() => { setActiveTab('JOURNALIST'); onClearChat(); }}
                icon={PenTool}
                iconColor="text-blue-600"
              >
                Journalist
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
                active={activeTab === 'roles'}
                onClick={() => setActiveTab('roles')}
                icon={Shield}
              >
                Roles & Permissions
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
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </aside>
  );
}
