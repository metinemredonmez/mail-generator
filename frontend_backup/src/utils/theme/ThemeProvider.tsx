'use client';

import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { buildTheme } from './Theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'uzman-mail-theme-mode';
const DEFAULT_THEME: ThemeMode = 'dark';

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Default olarak dark theme kullan
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // localStorage'dan theme'i yukle
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode);
    } else {
      // Ilk kez giris - default theme'i kaydet
      localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
      return newMode;
    });
  };

  const theme = useMemo(() => buildTheme(mode), [mode]);

  // Hydration mismatch onlemek icin - default theme ile render et
  if (!mounted) {
    return (
      <MUIThemeProvider theme={buildTheme(DEFAULT_THEME)}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    );
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}
