import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/src/utils/theme';
import { Providers } from '@/src/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uzman Mail Panel - E-posta Yonetim Sistemi',
  description: 'Nusuk kayit sistemi icin profesyonel e-posta yonetim paneli',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider>
            <Providers>
              {children}
              <Toaster position="top-right" />
            </Providers>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
