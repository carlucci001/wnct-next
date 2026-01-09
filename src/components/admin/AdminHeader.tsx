'use client';

import Link from 'next/link';
import { Settings, HelpCircle, Bell, MessageCircle, ExternalLink, LogOut, Sun, Moon, Palette, Check, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface SiteSettings {
  siteName?: string;
  logoUrl?: string;
  brandingMode?: 'text' | 'logo';
}

interface AdminHeaderProps {
  settings: SiteSettings;
  currentUser: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  onSettingsClick: () => void;
  onAccountClick?: () => void;
  onSignOut: () => void;
  version: string;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function AdminHeader({
  settings,
  currentUser,
  onSettingsClick,
  onAccountClick,
  onSignOut,
  version,
  mobileMenuOpen,
  onMobileMenuToggle
}: AdminHeaderProps) {
  const { theme, setTheme, colorMode, toggleColorMode, availableThemes } = useTheme();

  return (
    <TooltipProvider>
      <header className="h-16 border-b bg-card flex items-center justify-between px-3 md:px-6 shrink-0">
        {/* Left: Mobile Menu Button, Logo & Version */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileMenuToggle}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          {settings.brandingMode === 'logo' && settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.siteName || 'Site Logo'}
              className="max-h-8 md:max-h-10 w-auto object-contain"
            />
          ) : (
            <span className="font-serif font-bold text-lg md:text-xl">{settings.siteName || 'WNC Times'}</span>
          )}
          <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
            Newsroom OS v{version}
          </Badge>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-0.5 md:gap-1">
          {/* Settings - visible on all screens */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onSettingsClick} className="h-9 w-9 md:h-10 md:w-10">
                <Settings size={18} className="md:hidden" />
                <Settings size={20} className="hidden md:block" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          {/* Help - hidden on mobile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <HelpCircle size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help</TooltipContent>
          </Tooltip>

          {/* Notifications - visible on all screens */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
                <Bell size={18} className="md:hidden" />
                <Bell size={20} className="hidden md:block" />
                <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          {/* Messages - hidden on mobile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <MessageCircle size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Messages</TooltipContent>
          </Tooltip>

          {/* View Site - hidden on mobile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                <Link href="/" target="_blank">
                  <ExternalLink size={20} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Site</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 md:h-8 bg-border mx-1 md:mx-2" />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  {currentUser?.photoURL && <AvatarImage src={currentUser.photoURL} alt={currentUser?.displayName || 'User'} />}
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm md:text-base">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-background rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser?.displayName || 'Admin'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAccountClick} className="text-gray-900 dark:text-gray-100 cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-blue-600" />
                My Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleColorMode} className="text-gray-900 dark:text-gray-100 cursor-pointer">
                {colorMode === 'light' ? (
                  <Moon className="mr-2 h-4 w-4 text-indigo-600" />
                ) : (
                  <Sun className="mr-2 h-4 w-4 text-yellow-500" />
                )}
                {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-gray-900 dark:text-gray-100">
                  <Palette className="mr-2 h-4 w-4 text-purple-600" />
                  Color Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-48 bg-white dark:bg-gray-900">
                    {availableThemes.map((t) => (
                      <DropdownMenuItem
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        className="flex items-center justify-between text-gray-900 dark:text-gray-100 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: t.preview.primary }}
                          />
                          {t.label}
                        </span>
                        {theme === t.name && <Check className="h-4 w-4 text-green-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-red-600 dark:text-red-400 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
