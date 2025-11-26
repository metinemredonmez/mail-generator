'use client';

import { useState } from 'react';
import { Box, useMediaQuery, Theme } from '@mui/material';
import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';

const SIDEBAR_WIDTH = 270;

interface FullLayoutProps {
  children: React.ReactNode;
}

export default function FullLayout({ children }: FullLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { lg: `${SIDEBAR_WIDTH}px` },
          minHeight: '100vh',
          bgcolor: 'grey.100',
        }}
      >
        {/* Header */}
        <Header onMenuClick={handleSidebarToggle} />

        {/* Page Content */}
        <Box
          sx={{
            pt: '64px',
            px: 3,
            py: 3,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
