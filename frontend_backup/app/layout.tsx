import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/src/utils/theme';
import { Providers } from '@/src/components/providers';
import NavigationProgress from '@/components/NavigationProgress';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uzman Mail Panel - E-posta Yonetim Sistemi',
  description: 'Nusuk kayit sistemi icin profesyonel e-posta yonetim paneli',
};

// Theme flash'ini onlemek icin script
const themeScript = `
  (function() {
    try {
      var mode = localStorage.getItem('uzman-mail-theme-mode');
      if (mode === 'dark') {
        document.documentElement.style.colorScheme = 'dark';
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider>
            <Providers>
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              {children}
              <Toaster position="top-right" />
            </Providers>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
