// Theme configuration for shadcn/ui components
// Each theme defines CSS variables for light and dark modes

export interface Theme {
  name: string;
  label: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const themes: Record<string, Theme> = {
  default: {
    name: 'default',
    label: 'Default',
    description: 'Clean neutral gray theme',
    preview: {
      primary: '#1f2937',
      secondary: '#f3f4f6',
      accent: '#3b82f6',
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.205 0 0)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.97 0 0)',
        '--secondary-foreground': 'oklch(0.205 0 0)',
        '--accent': 'oklch(0.97 0 0)',
        '--accent-foreground': 'oklch(0.205 0 0)',
        '--sidebar-primary': 'oklch(0.205 0 0)',
      },
      dark: {
        '--primary': 'oklch(0.922 0 0)',
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--secondary': 'oklch(0.269 0 0)',
        '--secondary-foreground': 'oklch(0.985 0 0)',
        '--accent': 'oklch(0.269 0 0)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.488 0.243 264.376)',
      },
    },
  },
  blue: {
    name: 'blue',
    label: 'Ocean Blue',
    description: 'Professional blue theme',
    preview: {
      primary: '#1d4ed8',
      secondary: '#dbeafe',
      accent: '#3b82f6',
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.488 0.243 264.376)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.932 0.032 255.585)',
        '--secondary-foreground': 'oklch(0.293 0.066 255.585)',
        '--accent': 'oklch(0.623 0.214 259.815)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.488 0.243 264.376)',
      },
      dark: {
        '--primary': 'oklch(0.623 0.214 259.815)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.293 0.066 255.585)',
        '--secondary-foreground': 'oklch(0.932 0.032 255.585)',
        '--accent': 'oklch(0.488 0.243 264.376)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.623 0.214 259.815)',
      },
    },
  },
  green: {
    name: 'green',
    label: 'Forest Green',
    description: 'Natural green theme',
    preview: {
      primary: '#15803d',
      secondary: '#dcfce7',
      accent: '#22c55e',
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.527 0.154 150.069)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.962 0.044 156.743)',
        '--secondary-foreground': 'oklch(0.293 0.066 153.469)',
        '--accent': 'oklch(0.696 0.17 162.48)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.527 0.154 150.069)',
      },
      dark: {
        '--primary': 'oklch(0.696 0.17 162.48)',
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--secondary': 'oklch(0.293 0.066 153.469)',
        '--secondary-foreground': 'oklch(0.962 0.044 156.743)',
        '--accent': 'oklch(0.527 0.154 150.069)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.696 0.17 162.48)',
      },
    },
  },
  purple: {
    name: 'purple',
    label: 'Royal Purple',
    description: 'Elegant purple theme',
    preview: {
      primary: '#7c3aed',
      secondary: '#ede9fe',
      accent: '#a855f7',
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.541 0.281 293.009)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.962 0.044 293.756)',
        '--secondary-foreground': 'oklch(0.345 0.128 293.756)',
        '--accent': 'oklch(0.627 0.265 303.9)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.541 0.281 293.009)',
      },
      dark: {
        '--primary': 'oklch(0.627 0.265 303.9)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.345 0.128 293.756)',
        '--secondary-foreground': 'oklch(0.962 0.044 293.756)',
        '--accent': 'oklch(0.541 0.281 293.009)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.627 0.265 303.9)',
      },
    },
  },
  orange: {
    name: 'orange',
    label: 'Sunset Orange',
    description: 'Warm orange theme',
    preview: {
      primary: '#ea580c',
      secondary: '#ffedd5',
      accent: '#f97316',
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.646 0.222 41.116)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.962 0.059 58.455)',
        '--secondary-foreground': 'oklch(0.345 0.128 45.946)',
        '--accent': 'oklch(0.702 0.221 47.604)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.646 0.222 41.116)',
      },
      dark: {
        '--primary': 'oklch(0.702 0.221 47.604)',
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--secondary': 'oklch(0.345 0.128 45.946)',
        '--secondary-foreground': 'oklch(0.962 0.059 58.455)',
        '--accent': 'oklch(0.646 0.222 41.116)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.702 0.221 47.604)',
      },
    },
  },
  rose: {
    name: 'rose',
    label: 'Rose Pink',
    description: 'Soft rose theme',
    preview: {
      primary: '#e11d48',
      secondary: '#ffe4e6',
      accent: '#f43f5e',
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.577 0.245 27.325)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.962 0.044 12.177)',
        '--secondary-foreground': 'oklch(0.345 0.128 12.177)',
        '--accent': 'oklch(0.645 0.246 16.439)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.577 0.245 27.325)',
      },
      dark: {
        '--primary': 'oklch(0.645 0.246 16.439)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.345 0.128 12.177)',
        '--secondary-foreground': 'oklch(0.962 0.044 12.177)',
        '--accent': 'oklch(0.577 0.245 27.325)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.645 0.246 16.439)',
      },
    },
  },
  slate: {
    name: 'slate',
    label: 'Slate',
    description: 'Modern slate theme',
    preview: {
      primary: '#475569',
      secondary: '#f1f5f9',
      accent: '#64748b',
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.446 0.03 256.802)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--secondary': 'oklch(0.968 0.007 247.896)',
        '--secondary-foreground': 'oklch(0.208 0.042 265.755)',
        '--accent': 'oklch(0.554 0.046 257.417)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.446 0.03 256.802)',
      },
      dark: {
        '--primary': 'oklch(0.704 0.04 256.788)',
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--secondary': 'oklch(0.279 0.041 260.031)',
        '--secondary-foreground': 'oklch(0.968 0.007 247.896)',
        '--accent': 'oklch(0.446 0.03 256.802)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.704 0.04 256.788)',
      },
    },
  },
};

export const themeList = Object.values(themes);

export function getTheme(name: string): Theme {
  return themes[name] || themes.default;
}

export function applyTheme(themeName: string, isDark: boolean): void {
  const theme = getTheme(themeName);
  const vars = isDark ? theme.cssVars.dark : theme.cssVars.light;

  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
