'use client';

import { useState } from 'react';
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
  Grid,
  Paper,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  IconMail,
  IconMailOpened,
  IconRefresh,
  IconEye,
  IconCircleCheck,
  IconX,
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

  const { data, isLoading } = useQuery({
    queryKey: ['all-messages', page],
    queryFn: () => inboxApi.getAllMessages({ page, limit: 20 }).then((res) => res.data),
  });

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR');
  };

  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const unreadCount = data?.data?.filter((d: Message) => !d.isRead).length || 0;

  return (
    <FullLayout>
      <Box>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          mb={4}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Gelen Kutusu
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tum gelen mesajlari goruntuleyin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconRefresh size={20} />}
            onClick={() => syncAllMutation.mutate()}
            disabled={syncAllMutation.isPending}
          >
            {syncAllMutation.isPending ? 'Senkronize Ediliyor...' : 'Tum Kutulari Senkronize Et'}
          </Button>
        </Stack>

        {/* Stats */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                    <IconMail size={24} color="#5D87FF" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Toplam Mesaj
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {data?.meta?.total || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48 }}>
                    <IconMailOpened size={24} color="#FFAE1F" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Okunmamis
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {unreadCount}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48 }}>
                    <IconCircleCheck size={24} color="#13DEB9" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Kodlu Mesaj
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {data?.data?.filter((d: Message) => d.verificationCode).length || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Messages List */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Mesajlar
            </Typography>

            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Typography>Yukleniyor...</Typography>
              </Box>
            ) : data?.data?.length === 0 ? (
              <Box textAlign="center" py={8}>
                <IconMail size={64} color="#DFE5EF" />
                <Typography variant="h6" mt={2}>
                  Henuz mesaj yok
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gelen kutularini senkronize ettikten sonra mesajlar burada gorunecek
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {data?.data?.map((item: Message) => (
                  <Paper
                    key={item.id}
                    sx={{
                      p: 2,
                      bgcolor: item.isRead ? 'background.paper' : 'primary.light',
                      border: '1px solid',
                      borderColor: item.isRead ? 'divider' : 'primary.main',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: item.isRead ? 'action.hover' : 'primary.light',
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => openMessage(item)}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={2}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                        <Avatar
                          sx={{
                            bgcolor: item.isRead ? 'grey.200' : 'primary.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {item.isRead ? (
                            <IconMailOpened size={20} color="#666" />
                          ) : (
                            <IconMail size={20} color="#fff" />
                          )}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                              variant="subtitle2"
                              fontWeight={item.isRead ? 400 : 700}
                              noWrap
                            >
                              {item.fromAddress}
                            </Typography>
                            {!item.isRead && (
                              <Chip label="Yeni" size="small" color="primary" />
                            )}
                            {item.verificationCode && (
                              <Chip
                                label={`Kod: ${item.verificationCode}`}
                                size="small"
                                color="success"
                              />
                            )}
                          </Stack>
                          <Typography
                            variant="body2"
                            fontWeight={item.isRead ? 400 : 600}
                            noWrap
                            color={item.isRead ? 'text.secondary' : 'text.primary'}
                          >
                            {item.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {item.passenger
                              ? `${item.passenger.firstName} ${item.passenger.lastName} - `
                              : ''}
                            {item.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                          {formatDate(item.receivedAt)}
                        </Typography>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openMessage(item); }}>
                          <IconEye size={18} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}

            {/* Pagination */}
            {data?.meta && data.meta.totalPages > 1 && (
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mt={4}
                pt={3}
                borderTop={1}
                borderColor="divider"
              >
                <Typography variant="body2" color="text.secondary">
                  Toplam {data.meta.total} mesaj
                </Typography>
                <Pagination
                  count={data.meta.totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Stack>
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
                  <Typography variant="h6" fontWeight={600}>
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
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Gonderen
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedMessage.fromName || selectedMessage.fromAddress}
                        </Typography>
                        {selectedMessage.fromName && (
                          <Typography variant="caption" color="text.secondary">
                            {selectedMessage.fromAddress}
                          </Typography>
                        )}
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
                          {formatDate(selectedMessage.receivedAt)}
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
                          bgcolor: 'white',
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          maxHeight: 400,
                          overflow: 'auto',
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
                        }}
                      >
                        {selectedMessage.body || 'Mesaj icerigi bos'}
                      </Paper>
                    )}
                  </Box>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedMessage(null)}>Kapat</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </FullLayout>
  );
}
