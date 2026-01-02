'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { themes, getTheme, applyTheme, type Theme } from '@/lib/themes';

interface ThemeContextType {
  theme: string;
  colorMode: 'light' | 'dark';
  setTheme: (themeName: string) => void;
  setColorMode: (mode: 'light' | 'dark') => void;
  toggleColorMode: () => void;
  currentTheme: Theme;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'wnc_ui_theme';
const COLOR_MODE_STORAGE_KEY = 'wnc_color_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>('default');
  const [colorMode, setColorModeState] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'default';
    const savedColorMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY) as 'light' | 'dark' || 'light';

    setThemeState(savedTheme);
    setColorModeState(savedColorMode);
    setMounted(true);
  }, []);

  // Apply theme when theme or color mode changes
  useEffect(() => {
    if (!mounted) return;

    // Apply color mode class
    document.documentElement.classList.toggle('dark', colorMode === 'dark');

    // Apply theme CSS variables
    applyTheme(theme, colorMode === 'dark');

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
  }, [theme, colorMode, mounted]);

  const setTheme = useCallback((themeName: string) => {
    if (themes[themeName]) {
      setThemeState(themeName);
    }
  }, []);

  const setColorMode = useCallback((mode: 'light' | 'dark') => {
    setColorModeState(mode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorModeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const value: ThemeContextType = {
    theme,
    colorMode,
    setTheme,
    setColorMode,
    toggleColorMode,
    currentTheme: getTheme(theme),
    availableThemes: Object.values(themes),
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Default values for SSR/static generation
const defaultContextValue: ThemeContextType = {
  theme: 'default',
  colorMode: 'light',
  setTheme: () => {},
  setColorMode: () => {},
  toggleColorMode: () => {},
  currentTheme: getTheme('default'),
  availableThemes: Object.values(themes),
};

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return default values during SSR/static generation
  if (context === undefined) {
    return defaultContextValue;
  }
  return context;
}
