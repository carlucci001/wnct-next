'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, HelpCircle, Bell, MessageCircle, ExternalLink, LogOut, Sun, Moon, Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  } | null;
  onSettingsClick: () => void;
  onSignOut: () => void;
  version: string;
}

export function AdminHeader({
  settings,
  currentUser,
  onSettingsClick,
  onSignOut,
  version
}: AdminHeaderProps) {
  const { theme, setTheme, colorMode, toggleColorMode, availableThemes } = useTheme();

  return (
    <TooltipProvider>
      <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
        {/* Left: Logo & Version */}
        <div className="flex items-center gap-4">
          {settings.brandingMode === 'logo' && settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.siteName || 'Site Logo'}
              className="max-h-10 w-auto object-contain"
            />
          ) : (
            <span className="font-serif font-bold text-xl">{settings.siteName || 'WNC Times'}</span>
          )}
          <Badge variant="secondary" className="font-mono text-xs">
            Newsroom OS v{version}
          </Badge>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onSettingsClick}>
                <Settings size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <MessageCircle size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Messages</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/" target="_blank">
                  <ExternalLink size={20} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Site</TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-border mx-2" />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{currentUser?.displayName || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleColorMode}>
                {colorMode === 'light' ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Sun className="mr-2 h-4 w-4" />
                )}
                {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  Color Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-48">
                    {availableThemes.map((t) => (
                      <DropdownMenuItem
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: t.preview.primary }}
                          />
                          {t.label}
                        </span>
                        {theme === t.name && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
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
