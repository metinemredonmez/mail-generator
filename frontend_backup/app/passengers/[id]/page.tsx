'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  IconArrowLeft,
  IconMail,
  IconPhone,
  IconId,
  IconWorld,
  IconGenderMale,
  IconGenderFemale,
  IconCalendar,
  IconUsers,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconRefresh,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconInbox,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { passengersApi, emailsApi, inboxApi } from '@/lib/api';
import PassengerEditModal from '@/components/PassengerEditModal';
import ConfirmDialog from '@/components/ConfirmDialog';

const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'; icon: any }> = {
  PENDING: { label: 'Bekliyor', color: 'default', icon: IconClock },
  EMAIL_CREATED: { label: 'E-posta Olusturuldu', color: 'info', icon: IconMail },
  CODE_RECEIVED: { label: 'Kod Alindi', color: 'warning', icon: IconAlertCircle },
  ACCOUNT_VERIFIED: { label: 'Dogrulandi', color: 'success', icon: IconCircleCheck },
  COMPLETED: { label: 'Tamamlandi', color: 'success', icon: IconCircleCheck },
  FAILED: { label: 'Hata', color: 'error', icon: IconAlertCircle },
};

export default function PassengerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const passengerId = params.id as string;

  const [showPassword, setShowPassword] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: passenger, isLoading } = useQuery({
    queryKey: ['passenger', passengerId],
    queryFn: () => passengersApi.getById(passengerId).then((res) => res.data),
  });

  const { data: credentials, refetch: refetchCredentials } = useQuery({
    queryKey: ['email-credentials', passenger?.email?.id],
    queryFn: () => emailsApi.getCredentials(passenger?.email?.id).then((res) => res.data),
    enabled: !!passenger?.email?.id && showPassword,
  });

  const { data: inboxItems } = useQuery({
    queryKey: ['inbox', passenger?.email?.id],
    queryFn: () => inboxApi.getAll({ emailId: passenger?.email?.id, limit: 10 }).then((res) => res.data),
    enabled: !!passenger?.email?.id,
  });

  const createEmailMutation = useMutation({
    mutationFn: () => emailsApi.createForPassenger(passengerId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['passenger', passengerId] });
      toast.success(`E-posta olusturuldu: ${response.data.address}`, { duration: 10000 });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'E-posta olusturulamadi');
    },
  });

  const syncInboxMutation = useMutation({
    mutationFn: () => inboxApi.sync(passenger?.email?.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['inbox', passenger?.email?.id] });
      queryClient.invalidateQueries({ queryKey: ['passenger', passengerId] });
      toast.success(`${response.data.synced} yeni mesaj senkronize edildi`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Senkronizasyon basarisiz');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => passengersApi.update(passengerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passenger', passengerId] });
      toast.success('Yolcu guncellendi');
      setShowEditModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => passengersApi.delete(passengerId),
    onSuccess: () => {
      toast.success('Yolcu silindi');
      router.push('/passengers');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  const handleCopyEmail = () => {
    if (passenger?.email?.address) {
      navigator.clipboard.writeText(passenger.email.address);
      toast.success('E-posta kopyalandi');
    }
  };

  const handleCopyPassword = () => {
    if (credentials?.password) {
      navigator.clipboard.writeText(credentials.password);
      toast.success('Sifre kopyalandi');
    }
  };

  if (isLoading) {
    return (
      <FullLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </FullLayout>
    );
  }

  if (!passenger) {
    return (
      <FullLayout>
        <Alert severity="error">Yolcu bulunamadi</Alert>
      </FullLayout>
    );
  }

  const status = statusConfig[passenger.nusukStatus] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <FullLayout>
      <Box>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <IconButton onClick={() => router.back()}>
            <IconArrowLeft />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h4" fontWeight={700}>
              {passenger.firstName} {passenger.lastName}
            </Typography>
            <Chip
              icon={<StatusIcon size={14} />}
              label={status.label}
              size="small"
              color={status.color}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconEdit size={20} />}
              onClick={() => setShowEditModal(true)}
            >
              Duzenle
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<IconTrash size={20} />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Sil
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Kisisel Bilgiler */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Kisisel Bilgiler
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 64, height: 64 }}>
                      <Typography variant="h5" color="primary.main" fontWeight={600}>
                        {passenger.firstName?.[0]}{passenger.lastName?.[0]}
                      </Typography>
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{passenger.firstName} {passenger.lastName}</Typography>
                      {passenger.group && (
                        <Chip label={passenger.group.name} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Stack>
                  <Divider />
                  <Stack spacing={1.5}>
                    {passenger.phone && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconPhone size={20} />
                        <Typography>{passenger.phone}</Typography>
                      </Stack>
                    )}
                    {passenger.passportNo && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconId size={20} />
                        <Typography>{passenger.passportNo}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {passenger.gender === 'MALE' ? <IconGenderMale size={20} /> : <IconGenderFemale size={20} />}
                      <Typography>{passenger.gender === 'MALE' ? 'Erkek' : 'Kadin'}</Typography>
                    </Stack>
                    {passenger.nationality && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconWorld size={20} />
                        <Typography>{passenger.nationality}</Typography>
                      </Stack>
                    )}
                    {passenger.birthDate && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconCalendar size={20} />
                        <Typography>{new Date(passenger.birthDate).toLocaleDateString('tr-TR')}</Typography>
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* E-posta Bilgileri */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    E-posta Bilgileri
                  </Typography>
                  {passenger.email && (
                    <Button
                      size="small"
                      startIcon={<IconRefresh size={16} />}
                      onClick={() => syncInboxMutation.mutate()}
                      disabled={syncInboxMutation.isPending}
                    >
                      Senkronize Et
                    </Button>
                  )}
                </Stack>

                {passenger.email ? (
                  <Stack spacing={2}>
                    <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="caption" color="text.secondary">E-posta Adresi</Typography>
                          <Typography fontFamily="monospace">{passenger.email.address}</Typography>
                        </Box>
                        <Tooltip title="Kopyala">
                          <IconButton size="small" onClick={handleCopyEmail}>
                            <IconCopy size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="caption" color="text.secondary">Sifre</Typography>
                          <Typography fontFamily="monospace">
                            {showPassword && credentials?.password ? credentials.password : '••••••••'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title={showPassword ? 'Gizle' : 'Goster'}>
                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                            </IconButton>
                          </Tooltip>
                          {showPassword && credentials?.password && (
                            <Tooltip title="Kopyala">
                              <IconButton size="small" onClick={handleCopyPassword}>
                                <IconCopy size={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Durum</Typography>
                        <Typography>{passenger.email.isActive ? 'Aktif' : 'Pasif'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Mesaj Sayisi</Typography>
                        <Typography>{passenger.email._count?.inboxItems || 0}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Son Kontrol</Typography>
                        <Typography>
                          {passenger.email.lastChecked
                            ? new Date(passenger.email.lastChecked).toLocaleString('tr-TR')
                            : 'Henuz kontrol edilmedi'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                ) : (
                  <Box textAlign="center" py={4}>
                    <IconMail size={48} style={{ opacity: 0.3 }} />
                    <Typography color="text.secondary" mb={2}>
                      Henuz e-posta olusturulmamis
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<IconMail size={20} />}
                      onClick={() => createEmailMutation.mutate()}
                      disabled={createEmailMutation.isPending}
                    >
                      E-posta Olustur
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Gelen Kutusu */}
          {passenger.email && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      <IconInbox size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Gelen Kutusu
                    </Typography>
                  </Stack>

                  {inboxItems?.data?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Konu</TableCell>
                            <TableCell>Gonderen</TableCell>
                            <TableCell>Kod</TableCell>
                            <TableCell>Tarih</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {inboxItems.data.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.subject}</TableCell>
                              <TableCell>{item.fromAddress}</TableCell>
                              <TableCell>
                                {item.verificationCode ? (
                                  <Chip
                                    label={item.verificationCode}
                                    size="small"
                                    color="success"
                                    sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                                  />
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(item.receivedAt).toLocaleString('tr-TR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary">
                        Henuz mesaj yok
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Edit Modal */}
        <PassengerEditModal
          open={showEditModal}
          passenger={passenger}
          onClose={() => {
            setShowEditModal(false);
            queryClient.invalidateQueries({ queryKey: ['passenger', passengerId] });
          }}
        />

        {/* Delete Confirm */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Yolcu Sil"
          message={`"${passenger.firstName} ${passenger.lastName}" isimli yolcuyu silmek istediginize emin misiniz? Bu islem geri alinamaz.`}
          confirmText="Sil"
          confirmColor="error"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleteMutation.isPending}
        />
      </Box>
    </FullLayout>
  );
}
