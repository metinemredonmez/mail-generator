'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import {
  IconBell,
  IconCheck,
  IconChecks,
  IconMail,
  IconKey,
  IconAlertCircle,
  IconInfoCircle,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { notificationsApi } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  data?: any;
  createdAt: string;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  VERIFICATION_CODE: { icon: IconKey, color: '#f59e0b' },
  NEW_EMAIL: { icon: IconMail, color: '#3b82f6' },
  EMAIL_CREATED: { icon: IconMail, color: '#10b981' },
  BULK_COMPLETE: { icon: IconChecks, color: '#8b5cf6' },
  SYNC_COMPLETE: { icon: IconRefresh, color: '#06b6d4' },
  ERROR: { icon: IconAlertCircle, color: '#ef4444' },
  INFO: { icon: IconInfoCircle, color: '#6b7280' },
};

export default function NotificationDropdown() {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Okunmamis bildirim sayisi
  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getUnreadCount().then((res) => res.data),
    refetchInterval: 30000, // Her 30 saniyede bir kontrol et
  });

  // Bildirimler listesi (menu acildiginda)
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 10 }).then((res) => res.data),
    enabled: open,
  });

  // Bildirimi okundu olarak isaretle
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  // Tum bildirimleri okundu yap
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Ilgili sayfaya yonlendir
    if (notification.entityType === 'passenger' && notification.entityId) {
      window.location.href = `/passengers/${notification.entityId}`;
    } else if (notification.entityType === 'inbox' && notification.data?.passengerId) {
      window.location.href = `/passengers/${notification.data.passengerId}`;
    }

    handleClose();
  };

  const unreadCount = countData?.count || 0;
  const notifications: Notification[] = notificationsData?.data || [];

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: 'text.primary', mr: 1 }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <IconBell size={20} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1.5,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Bildirimler
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
              />
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<IconChecks size={16} />}
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Tumunu Oku
            </Button>
          )}
        </Box>
        <Divider />

        {/* Loading */}
        {isLoading && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <IconBell size={40} style={{ opacity: 0.3 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Bildirim yok
            </Typography>
          </Box>
        )}

        {/* Notification List */}
        {!isLoading && notifications.length > 0 && (
          <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
            {notifications.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.INFO;
              const Icon = config.icon;

              return (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    borderLeft: notification.isRead ? 'none' : `3px solid ${config.color}`,
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start" width="100%">
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: `${config.color}20`,
                        color: config.color,
                      }}
                    >
                      <Icon size={18} />
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={notification.isRead ? 400 : 600}
                        noWrap
                      >
                        {notification.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </Typography>
                    </Box>
                    {!notification.isRead && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mt: 0.5,
                        }}
                      />
                    )}
                  </Stack>
                </MenuItem>
              );
            })}
          </Box>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button
                size="small"
                onClick={() => {
                  window.location.href = '/activity';
                  handleClose();
                }}
              >
                Tum Bildirimleri Gor
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
