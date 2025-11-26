'use client';

import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Badge,
  useTheme,
} from '@mui/material';
import {
  IconMenu2,
  IconBell,
  IconUser,
  IconLogout,
  IconSettings,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@/src/utils/theme';

const SIDEBAR_WIDTH = 270;

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
    handleClose();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: { lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { lg: `${SIDEBAR_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <IconButton
          color="inherit"
          aria-label="open menu"
          edge="start"
          onClick={onMenuClick}
          sx={{
            mr: 2,
            display: { lg: 'none' },
            color: 'text.primary',
          }}
        >
          <IconMenu2 size={24} />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        {/* Theme Toggle */}
        <IconButton
          onClick={toggleTheme}
          sx={{ color: 'text.primary', mr: 1 }}
        >
          {mode === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
        </IconButton>

        {/* Notifications */}
        <IconButton sx={{ color: 'text.primary', mr: 1 }}>
          <Badge badgeContent={3} color="primary">
            <IconBell size={20} />
          </Badge>
        </IconButton>

        {/* User Menu */}
        <Box>
          <IconButton
            onClick={handleMenu}
            sx={{
              p: 0.5,
              border: '2px solid',
              borderColor: 'primary.light',
            }}
          >
            <Avatar
              sx={{
                width: 35,
                height: 35,
                bgcolor: 'primary.main',
              }}
            >
              <IconUser size={20} />
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                admin@mailpanel.com
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <IconUser size={18} />
              </ListItemIcon>
              Profil
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <IconSettings size={18} />
              </ListItemIcon>
              Ayarlar
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <IconLogout size={18} color={theme.palette.error.main} />
              </ListItemIcon>
              Cikis Yap
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
