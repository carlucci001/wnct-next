'use client';

import { ChevronDown, X, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/user';
import {
  AccountTab,
  MenuSection,
  getAccountMenuSections,
  canAccessAdmin,
} from '@/config/accountMenus';
import { useState } from 'react';

interface AccountSidebarProps {
  activeTab: AccountTab;
  setActiveTab: (tab: AccountTab) => void;
  userRole: UserRole;
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

const NavItem = ({
  active,
  onClick,
  icon: Icon,
  iconColor,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
}) => (
  <Button
    variant={active ? 'secondary' : 'ghost'}
    className={cn(
      'w-full justify-start gap-3 font-medium',
      active && 'bg-primary/10 text-primary hover:bg-primary/15'
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
  isOpen,
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
        'transition-transform duration-200',
        !isOpen && '-rotate-90'
      )}
    />
  </div>
);

export function AccountSidebar({
  activeTab,
  setActiveTab,
  userRole,
  mobileMenuOpen,
  onMobileMenuClose,
}: AccountSidebarProps) {
  const menuSections = getAccountMenuSections(userRole);

  // Track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      menuSections.forEach((section) => {
        initial[section.id] = true; // All sections open by default
      });
      return initial;
    }
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleTabClick = (tab: AccountTab) => {
    setActiveTab(tab);
    onMobileMenuClose?.();
  };

  const sidebarContent = (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-4 pb-8">
        {menuSections.map((section, index) => (
          <div key={section.id}>
            {index > 0 && <Separator className="mb-4" />}
            <Collapsible
              open={openSections[section.id]}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="w-full">
                <SectionHeader
                  title={section.label}
                  icon={section.icon}
                  iconColor={section.iconColor}
                  isOpen={openSections[section.id]}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1">
                {section.items.map((item) => (
                  <NavItem
                    key={item.id}
                    active={activeTab === item.id}
                    onClick={() => handleTabClick(item.id)}
                    icon={item.icon}
                    iconColor={item.iconColor}
                  >
                    {item.label}
                  </NavItem>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}

        {/* Admin Panel Link */}
        {canAccessAdmin(userRole) && (
          <>
            <Separator />
            <div className="pt-2">
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 font-medium border-dashed"
                >
                  <Shield size={16} className="text-slate-500" />
                  Admin Panel
                </Button>
              </Link>
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
          'fixed inset-y-0 left-0 z-50 w-64 border-r bg-card flex flex-col transform transition-transform duration-300 ease-in-out md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ top: '64px' }}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-sm">My Account</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuClose}
            className="h-8 w-8"
          >
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
