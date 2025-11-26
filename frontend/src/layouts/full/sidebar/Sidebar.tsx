'use client';

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  useMediaQuery,
  Theme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import MenuItems from './MenuItems';
import { IconMail } from '@tabler/icons-react';

const SIDEBAR_WIDTH = 270;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

  const handleNavigation = (href: string) => {
    router.push(href);
    if (!lgUp) {
      onClose();
    }
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconMail size={24} color="white" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Uzman
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Mail Panel
          </Typography>
        </Box>
      </Box>

      {/* Menu */}
      <Box sx={{ px: 2, py: 1, flex: 1, overflowY: 'auto' }}>
        {MenuItems.map((section) => (
          <Box key={section.subheader} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                px: 2,
                py: 1,
                display: 'block',
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {section.subheader}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isSelected = pathname === item.href;

                return (
                  <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => handleNavigation(item.href)}
                      sx={{
                        borderRadius: '8px',
                        py: 1,
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          color: 'primary.main',
                          '& .MuiListItemIcon-root': {
                            color: 'primary.main',
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Icon size={20} stroke={1.5} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      />
                      {item.chip && (
                        <Chip
                          label={item.chip}
                          size="small"
                          color={item.chipColor || 'primary'}
                          sx={{ height: 22, fontSize: '0.65rem' }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
          Uzman Mail Panel v1.0
        </Typography>
      </Box>
    </Box>
  );

  if (lgUp) {
    return (
      <Drawer
        variant="permanent"
        anchor="left"
        open
        PaperProps={{
          sx: {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
}
