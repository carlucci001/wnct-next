'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Palette, Check } from 'lucide-react';

interface ThemeSelectorProps {
  variant?: 'dropdown' | 'grid';
  showLabel?: boolean;
}

export default function ThemeSelector({ variant = 'dropdown', showLabel = true }: ThemeSelectorProps) {
  const { theme, setTheme, availableThemes } = useTheme();

  if (variant === 'grid') {
    return (
      <div className="space-y-2">
        {showLabel && (
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Palette size={16} />
            <span>Color Theme</span>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          {availableThemes.map((t) => (
            <button
              key={t.name}
              onClick={() => setTheme(t.name)}
              className={`relative group flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                theme === t.name
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              title={t.description}
            >
              <div className="flex gap-0.5 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: t.preview.primary }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: t.preview.accent }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate max-w-full">
                {t.label}
              </span>
              {theme === t.name && (
                <Check size={12} className="absolute -top-1 -right-1 text-primary bg-white dark:bg-gray-800 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Dropdown variant - shows as a submenu
  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          <Palette size={12} />
          Theme
        </div>
      )}
      {availableThemes.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
            theme === t.name
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <div className="flex gap-1">
            <div
              className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
              style={{ backgroundColor: t.preview.primary }}
            />
            <div
              className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
              style={{ backgroundColor: t.preview.accent }}
            />
          </div>
          <span className="flex-1 text-left">{t.label}</span>
          {theme === t.name && <Check size={14} />}
        </button>
      ))}
    </div>
  );
}
