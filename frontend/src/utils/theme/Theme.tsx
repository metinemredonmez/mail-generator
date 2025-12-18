'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';
import { Plus_Jakarta_Sans } from 'next/font/google';
import components from './Components';
import typography from './Typography';
import { shadows, darkshadows } from './Shadows';
import { baselightTheme, baseDarkTheme } from './DefaultColors';

export const plus = Plus_Jakarta_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

export const buildTheme = (mode: 'light' | 'dark' = 'light') => {
  const defaultTheme = mode === 'dark' ? baseDarkTheme : baselightTheme;
  const defaultShadow = mode === 'dark' ? darkshadows : shadows;

  const themeOptions: ThemeOptions = {
    direction: 'ltr',
    palette: {
      mode,
      ...defaultTheme.palette,
    },
    shape: {
      borderRadius: 7,
    },
    shadows: defaultShadow,
    typography: {
      ...typography,
      fontFamily: plus.style.fontFamily,
    },
  };

  const theme = createTheme(themeOptions);
  theme.components = components(theme);

  return theme;
};

// Default light theme
const theme = buildTheme('light');

export default theme;
