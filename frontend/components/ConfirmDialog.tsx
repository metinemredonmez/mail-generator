'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Box,
} from '@mui/material';
import { IconAlertTriangle, IconTrash, IconCheck } from '@tabler/icons-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  loadingText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'Iptal',
  confirmColor,
  type = 'danger',
  loading = false,
  loadingText = 'Isleniyor...',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <IconTrash size={48} color="#f44336" />;
      case 'warning':
        return <IconAlertTriangle size={48} color="#ff9800" />;
      default:
        return <IconCheck size={48} color="#2196f3" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      {loading ? (
        // Loading state
        <Box sx={{ py: 6, px: 4 }}>
          <Stack alignItems="center" spacing={3}>
            <CircularProgress size={56} thickness={4} />
            <Typography variant="h6" color="text.primary">
              {loadingText}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Lutfen bekleyin, bu islem biraz zaman alabilir...
            </Typography>
          </Stack>
        </Box>
      ) : (
        // Normal state
        <>
          <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
            <Stack alignItems="center" spacing={2}>
              {getIcon()}
              <Typography variant="h6">{title}</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {typeof message === 'string' ? (
              <Typography variant="body1" color="text.secondary" textAlign="center">
                {message}
              </Typography>
            ) : (
              message
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button
              variant="contained"
              color={confirmColor || getButtonColor()}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
