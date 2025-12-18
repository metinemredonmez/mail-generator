'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Paper,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  IconMail,
  IconMailOpened,
  IconRefresh,
  IconEye,
  IconCircleCheck,
  IconX,
  IconFilter,
  IconTrash,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { inboxApi } from '@/lib/api';

interface Message {
  id: string;
  messageId: string;
  subject: string;
  fromAddress: string;
  fromName?: string;
  body: string;
  htmlBody?: string;
  verificationCode?: string;
  codeType?: string;
  isRead: boolean;
  receivedAt: string;
  email?: string;
  passenger?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['all-messages', page],
    queryFn: () => inboxApi.getAllMessages({ page, limit: 100 }).then((res) => res.data),
  });

  // E-posta adreslerini çıkar
  const emailAddresses = useMemo(() => {
    if (!data?.data) return [];
    const emailSet = new Set(data.data.map((m: Message) => m.email).filter(Boolean));
    const emails = Array.from(emailSet) as string[];
    return emails.sort();
  }, [data?.data]);

  // Filtrelenmiş mesajlar
  const filteredMessages = useMemo(() => {
    if (!data?.data) return [];
    if (selectedEmail === 'all') return data.data;
    return data.data.filter((m: Message) => m.email === selectedEmail);
  }, [data?.data, selectedEmail]);

  const syncAllMutation = useMutation({
    mutationFn: inboxApi.syncAll,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['all-messages'] });
      toast.success(`${response.data.success} e-posta senkronize edildi`);
    },
    onError: () => {
      toast.error('Senkronizasyon hatasi');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: inboxApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-messages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: inboxApi.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-messages'] });
      setSelectedMessage(null);
      toast.success('Mesaj silindi');
    },
    onError: () => {
      toast.error('Silme hatasi');
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR');
  };

  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const unreadCount = filteredMessages.filter((d: Message) => !d.isRead).length;
  const codeCount = filteredMessages.filter((d: Message) => d.verificationCode).length;

  return (
    <FullLayout>
      <Box>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Gelen Kutusu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredMessages.length} mesaj {selectedEmail !== 'all' && `(${selectedEmail})`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>E-posta Filtrele</InputLabel>
              <Select
                value={selectedEmail}
                label="E-posta Filtrele"
                onChange={(e) => setSelectedEmail(e.target.value)}
              >
                <MenuItem value="all">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconMail size={16} />
                    <span>Tum E-postalar ({data?.data?.length || 0})</span>
                  </Stack>
                </MenuItem>
                {emailAddresses.map((email: string) => {
                  const count = data?.data?.filter((m: Message) => m.email === email).length || 0;
                  return (
                    <MenuItem key={email} value={email}>
                      {email} ({count})
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<IconRefresh size={18} />}
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              size="small"
            >
              {syncAllMutation.isPending ? 'Senkronize...' : 'Senkronize Et'}
            </Button>
          </Stack>
        </Stack>

        {/* Stats - Kompakt */}
        <Stack direction="row" spacing={2} mb={3}>
          <Chip
            icon={<IconMail size={16} />}
            label={`${filteredMessages.length} Mesaj`}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<IconMailOpened size={16} />}
            label={`${unreadCount} Okunmamis`}
            color={unreadCount > 0 ? 'warning' : 'default'}
            variant={unreadCount > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            icon={<IconCircleCheck size={16} />}
            label={`${codeCount} Kodlu`}
            color={codeCount > 0 ? 'success' : 'default'}
            variant={codeCount > 0 ? 'filled' : 'outlined'}
          />
        </Stack>

        {/* Messages List - Kompakt */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Box textAlign="center" py={4}>
                <Typography>Yukleniyor...</Typography>
              </Box>
            ) : filteredMessages.length === 0 ? (
              <Box textAlign="center" py={4}>
                <IconMail size={48} color="#DFE5EF" />
                <Typography variant="body1" mt={1}>
                  {selectedEmail === 'all' ? 'Henuz mesaj yok' : 'Bu e-postada mesaj yok'}
                </Typography>
              </Box>
            ) : (
              <Box>
                {filteredMessages.map((item: Message, index: number) => (
                  <Box
                    key={item.id}
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'pointer',
                      borderBottom: index < filteredMessages.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      bgcolor: item.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    onClick={() => openMessage(item)}
                  >
                    {/* Okunmamış indicator */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: item.isRead ? 'transparent' : 'primary.main',
                        flexShrink: 0,
                      }}
                    />

                    {/* Gönderen */}
                    <Typography
                      variant="body2"
                      sx={{
                        width: 180,
                        flexShrink: 0,
                        fontWeight: item.isRead ? 400 : 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.fromAddress.split('@')[0]}
                    </Typography>

                    {/* Konu ve içerik */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: item.isRead ? 400 : 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.subject}
                        </Typography>
                        {item.verificationCode && (
                          <Chip
                            label={item.verificationCode}
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {item.email} {item.passenger && `• ${item.passenger.firstName} ${item.passenger.lastName}`}
                      </Typography>
                    </Box>

                    {/* Tarih ve Sil */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ width: 50, textAlign: 'right' }}
                      >
                        {formatDate(item.receivedAt)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Bu mesaji silmek istediginizden emin misiniz?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        sx={{
                          opacity: 0.5,
                          '&:hover': { opacity: 1, color: 'error.main' }
                        }}
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Message Detail Dialog */}
        <Dialog
          open={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedMessage && (
            <>
              <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={600} noWrap sx={{ flex: 1 }}>
                    {selectedMessage.subject}
                  </Typography>
                  <IconButton onClick={() => setSelectedMessage(null)}>
                    <IconX size={20} />
                  </IconButton>
                </Stack>
              </DialogTitle>
              <Divider />
              <DialogContent>
                <Stack spacing={2}>
                  {/* Header Info */}
                  <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Gonderen
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedMessage.fromName || selectedMessage.fromAddress}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Alici
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedMessage.email}
                        </Typography>
                        {selectedMessage.passenger && (
                          <Typography variant="caption" color="text.secondary">
                            {selectedMessage.passenger.firstName} {selectedMessage.passenger.lastName}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Tarih
                        </Typography>
                        <Typography variant="body2">
                          {formatFullDate(selectedMessage.receivedAt)}
                        </Typography>
                      </Grid>
                      {selectedMessage.verificationCode && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Dogrulama Kodu
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight={700}
                            fontFamily="monospace"
                            color="success.main"
                          >
                            {selectedMessage.verificationCode}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  {/* Message Body */}
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" mb={1}>
                      Mesaj Icerigi
                    </Typography>
                    {selectedMessage.htmlBody ? (
                      <Box
                        sx={{
                          bgcolor: 'background.paper',
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          maxHeight: 400,
                          overflow: 'auto',
                          '& *': { color: 'text.primary' },
                        }}
                        dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }}
                      />
                    ) : (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          maxHeight: 400,
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          color: 'text.primary',
                        }}
                      >
                        {selectedMessage.body || 'Mesaj icerigi bos'}
                      </Paper>
                    )}
                  </Box>
                </Stack>
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'space-between' }}>
                <Button
                  color="error"
                  startIcon={<IconTrash size={18} />}
                  onClick={() => {
                    if (confirm('Bu mesaji silmek istediginizden emin misiniz?')) {
                      deleteMutation.mutate(selectedMessage.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Sil
                </Button>
                <Button onClick={() => setSelectedMessage(null)}>Kapat</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </FullLayout>
  );
}
