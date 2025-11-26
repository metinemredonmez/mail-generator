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
} from '@mui/material';
import {
  IconInbox,
  IconRefresh,
  IconCopy,
  IconCircleCheck,
  IconMail,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { inboxApi } from '@/lib/api';

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['verification-codes', page],
    queryFn: () => inboxApi.getAllCodes({ page, limit: 20 }).then((res) => res.data),
  });

  const syncAllMutation = useMutation({
    mutationFn: inboxApi.syncAll,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['verification-codes'] });
      toast.success(`${response.data.success} e-posta senkronize edildi`);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: inboxApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-codes'] });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kod kopyalandi!');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR');
  };

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
              Dogrulama Kodlari
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tum gelen dogrulama kodlarini goruntuleyin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconRefresh size={20} />}
            onClick={() => syncAllMutation.mutate()}
            disabled={syncAllMutation.isPending}
          >
            {syncAllMutation.isPending ? 'Kontrol Ediliyor...' : 'Gelen Kutularini Kontrol Et'}
          </Button>
        </Stack>

        {/* Stats */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48 }}>
                    <IconCircleCheck size={24} color="#13DEB9" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Toplam Kod
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
                  <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                    <IconMail size={24} color="#5D87FF" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Okunmamis
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {data?.data?.filter((d: any) => !d.isRead).length || 0}
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
                    <IconInbox size={24} color="#FFAE1F" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nusuk Kodu
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {data?.data?.filter((d: any) => d.codeType === 'NUSUK').length || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Codes List */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Son Gelen Kodlar
            </Typography>

            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Typography>Yukleniyor...</Typography>
              </Box>
            ) : data?.data?.length === 0 ? (
              <Box textAlign="center" py={8}>
                <IconInbox size={64} color="#DFE5EF" />
                <Typography variant="h6" mt={2}>
                  Henuz dogrulama kodu yok
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yolculara e-posta olusturduktan sonra gelen kodlar burada gorunecek
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {data?.data?.map((item: any) => (
                  <Paper
                    key={item.id}
                    sx={{
                      p: 2,
                      bgcolor: item.isRead ? 'grey.100' : 'primary.light',
                      border: '1px solid',
                      borderColor: item.isRead ? 'divider' : 'primary.main',
                      borderRadius: 2,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={2}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: item.codeType === 'NUSUK' ? 'warning.light' : 'success.light',
                            width: 48,
                            height: 48,
                          }}
                        >
                          <IconCircleCheck
                            size={24}
                            color={item.codeType === 'NUSUK' ? '#FFAE1F' : '#13DEB9'}
                          />
                        </Avatar>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1" fontWeight={600}>
                              {item.passenger?.firstName} {item.passenger?.lastName}
                            </Typography>
                            {!item.isRead && (
                              <Chip label="Yeni" size="small" color="primary" />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {item.email?.address || item.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.subject}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box textAlign="right">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography
                              variant="h4"
                              fontWeight={700}
                              fontFamily="monospace"
                              color="success.main"
                            >
                              {item.code}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(item.code)}
                            >
                              <IconCopy size={20} />
                            </IconButton>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.receivedAt)}
                          </Typography>
                        </Box>
                        <Stack spacing={1} alignItems="center">
                          <Chip
                            label={item.codeType || 'DIGER'}
                            size="small"
                            color={item.codeType === 'NUSUK' ? 'warning' : 'default'}
                          />
                          {!item.isRead && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => markAsReadMutation.mutate(item.id)}
                            >
                              Okundu
                            </Button>
                          )}
                        </Stack>
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
                  Toplam {data.meta.total} kod
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
      </Box>
    </FullLayout>
  );
}
