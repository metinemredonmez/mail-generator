'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
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
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
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
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color={confirmColor || getButtonColor()}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Isleniyor...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
