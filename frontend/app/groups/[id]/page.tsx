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
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Avatar,
  Checkbox,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  IconArrowLeft,
  IconUsers,
  IconCalendar,
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconUserMinus,
  IconMail,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconSearch,
  IconEye,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { groupsApi, passengersApi, emailsApi } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';

const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'; icon: any }> = {
  PENDING: { label: 'Bekliyor', color: 'default', icon: IconClock },
  EMAIL_CREATED: { label: 'E-posta Olusturuldu', color: 'info', icon: IconMail },
  CODE_RECEIVED: { label: 'Kod Alindi', color: 'warning', icon: IconAlertCircle },
  ACCOUNT_VERIFIED: { label: 'Dogrulandi', color: 'success', icon: IconCircleCheck },
  COMPLETED: { label: 'Tamamlandi', color: 'success', icon: IconCircleCheck },
  FAILED: { label: 'Hata', color: 'error', icon: IconAlertCircle },
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const groupId = params.id as string;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddPassengersModal, setShowAddPassengersModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [selectedPassengerToRemove, setSelectedPassengerToRemove] = useState<any>(null);
  const [searchPassenger, setSearchPassenger] = useState('');
  const [selectedPassengersToAdd, setSelectedPassengersToAdd] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({ name: '', description: '', startDate: '', endDate: '' });

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.getById(groupId).then((res) => res.data),
  });

  const { data: availablePassengers } = useQuery({
    queryKey: ['available-passengers', searchPassenger],
    queryFn: () => passengersApi.getAll({ search: searchPassenger, limit: 50 }).then((res) => res.data),
    enabled: showAddPassengersModal,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => groupsApi.update(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Grup guncellendi');
      setShowEditModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => groupsApi.delete(groupId),
    onSuccess: () => {
      toast.success('Grup silindi');
      router.push('/groups');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  const addPassengersMutation = useMutation({
    mutationFn: (passengerIds: string[]) => groupsApi.addPassengers(groupId, passengerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Yolcular gruba eklendi');
      setShowAddPassengersModal(false);
      setSelectedPassengersToAdd([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  const removePassengerMutation = useMutation({
    mutationFn: (passengerId: string) => groupsApi.removePassengers(groupId, [passengerId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Yolcu gruptan cikarildi');
      setShowRemoveConfirm(false);
      setSelectedPassengerToRemove(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  const createEmailMutation = useMutation({
    mutationFn: (passengerId: string) => emailsApi.createForPassenger(passengerId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success(`E-posta olusturuldu: ${response.data.address}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'E-posta olusturulamadi');
    },
  });

  const handleOpenEditModal = () => {
    setEditForm({
      name: group?.name || '',
      description: group?.description || '',
      startDate: group?.startDate ? group.startDate.split('T')[0] : '',
      endDate: group?.endDate ? group.endDate.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleTogglePassenger = (passengerId: string) => {
    setSelectedPassengersToAdd((prev) =>
      prev.includes(passengerId)
        ? prev.filter((id) => id !== passengerId)
        : [...prev, passengerId]
    );
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

  if (!group) {
    return (
      <FullLayout>
        <Alert severity="error">Grup bulunamadi</Alert>
      </FullLayout>
    );
  }

  const passengers = group.passengers || [];
  const passengersWithoutGroup = availablePassengers?.data?.filter(
    (p: any) => !p.groupId || p.groupId !== groupId
  ) || [];

  const columns: GridColDef[] = [
    {
      field: 'fullName',
      headerName: 'Ad Soyad',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
            <Typography variant="body2" color="primary.main" fontWeight={600}>
              {params.row.firstName?.[0]}{params.row.lastName?.[0]}
            </Typography>
          </Avatar>
          <Typography variant="subtitle2" fontWeight={600}>
            {params.row.firstName} {params.row.lastName}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'phone',
      headerName: 'Telefon',
      width: 130,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'passportNo',
      headerName: 'Pasaport No',
      width: 130,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'email',
      headerName: 'E-posta',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => {
        if (params.row.email) {
          return (
            <Typography variant="body2" fontFamily="monospace" color="text.secondary">
              {params.row.email.address}
            </Typography>
          );
        }
        return (
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconMail size={16} />}
            onClick={() => createEmailMutation.mutate(params.row.id)}
            disabled={createEmailMutation.isPending}
          >
            Olustur
          </Button>
        );
      },
    },
    {
      field: 'nusukStatus',
      headerName: 'Durum',
      width: 160,
      renderCell: (params: GridRenderCellParams) => {
        const status = statusConfig[params.value] || statusConfig.PENDING;
        const StatusIcon = status.icon;
        return (
          <Chip
            icon={<StatusIcon size={14} />}
            label={status.label}
            size="small"
            color={status.color}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Islemler',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Goruntule">
            <IconButton
              size="small"
              color="primary"
              onClick={() => router.push(`/passengers/${params.row.id}`)}
            >
              <IconEye size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gruptan Cikar">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setSelectedPassengerToRemove(params.row);
                setShowRemoveConfirm(true);
              }}
            >
              <IconUserMinus size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

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
              {group.name}
            </Typography>
            {group.description && (
              <Typography variant="body1" color="text.secondary">
                {group.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconEdit size={20} />}
              onClick={handleOpenEditModal}
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
          {/* Grup Bilgileri */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Grup Bilgileri
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 64, height: 64 }}>
                      <IconUsers size={32} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{group.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {passengers.length} Yolcu
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <Stack spacing={1.5}>
                    {group.startDate && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconCalendar size={20} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Baslangic Tarihi</Typography>
                          <Typography>{new Date(group.startDate).toLocaleDateString('tr-TR')}</Typography>
                        </Box>
                      </Stack>
                    )}
                    {group.endDate && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconCalendar size={20} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Bitis Tarihi</Typography>
                          <Typography>{new Date(group.endDate).toLocaleDateString('tr-TR')}</Typography>
                        </Box>
                      </Stack>
                    )}
                  </Stack>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Durum Ozeti</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                      {Object.entries(statusConfig).map(([key, config]) => {
                        const count = passengers.filter((p: any) => p.nusukStatus === key).length;
                        if (count === 0) return null;
                        return (
                          <Chip
                            key={key}
                            label={`${config.label}: ${count}`}
                            size="small"
                            color={config.color}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Yolcu Listesi */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    Yolcular ({passengers.length})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<IconUserPlus size={20} />}
                    onClick={() => setShowAddPassengersModal(true)}
                  >
                    Yolcu Ekle
                  </Button>
                </Stack>

                {passengers.length > 0 ? (
                  <DataGrid
                    rows={passengers}
                    columns={columns}
                    autoHeight
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      },
                    }}
                  />
                ) : (
                  <Box textAlign="center" py={4}>
                    <IconUsers size={48} style={{ opacity: 0.3 }} />
                    <Typography color="text.secondary" mb={2}>
                      Bu grupta henuz yolcu yok
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<IconUserPlus size={20} />}
                      onClick={() => setShowAddPassengersModal(true)}
                    >
                      Yolcu Ekle
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Grubu Duzenle</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Grup Adi"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Aciklama"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Baslangic Tarihi"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Bitis Tarihi"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="outlined" onClick={() => setShowEditModal(false)}>
              Iptal
            </Button>
            <Button
              variant="contained"
              onClick={() => updateMutation.mutate(editForm)}
              disabled={updateMutation.isPending}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Passengers Modal */}
        <Dialog open={showAddPassengersModal} onClose={() => setShowAddPassengersModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Gruba Yolcu Ekle</DialogTitle>
          <DialogContent>
            <TextField
              placeholder="Yolcu ara..."
              value={searchPassenger}
              onChange={(e) => setSearchPassenger(e.target.value)}
              size="small"
              fullWidth
              sx={{ my: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
            />
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {passengersWithoutGroup.map((passenger: any) => (
                <ListItem key={passenger.id} disablePadding>
                  <ListItemButton onClick={() => handleTogglePassenger(passenger.id)}>
                    <Checkbox
                      checked={selectedPassengersToAdd.includes(passenger.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        {passenger.firstName?.[0]}{passenger.lastName?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${passenger.firstName} ${passenger.lastName}`}
                      secondary={passenger.group ? `Mevcut: ${passenger.group.name}` : 'Grupsuz'}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {passengersWithoutGroup.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  Eklenebilecek yolcu bulunamadi
                </Typography>
              )}
            </List>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="outlined" onClick={() => setShowAddPassengersModal(false)}>
              Iptal
            </Button>
            <Button
              variant="contained"
              onClick={() => addPassengersMutation.mutate(selectedPassengersToAdd)}
              disabled={selectedPassengersToAdd.length === 0 || addPassengersMutation.isPending}
            >
              {selectedPassengersToAdd.length} Yolcu Ekle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Grubu Sil"
          message={`"${group.name}" grubunu silmek istediginize emin misiniz? Gruptaki yolcular silinmeyecek, sadece gruptan cikarilacak.`}
          confirmText="Sil"
          confirmColor="error"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleteMutation.isPending}
        />

        {/* Remove Passenger Confirm */}
        <ConfirmDialog
          open={showRemoveConfirm}
          title="Yolcuyu Gruptan Cikar"
          message={`"${selectedPassengerToRemove?.firstName} ${selectedPassengerToRemove?.lastName}" isimli yolcuyu gruptan cikarmak istediginize emin misiniz?`}
          confirmText="Cikar"
          confirmColor="warning"
          onConfirm={() => {
            if (selectedPassengerToRemove) {
              removePassengerMutation.mutate(selectedPassengerToRemove.id);
            }
          }}
          onCancel={() => {
            setShowRemoveConfirm(false);
            setSelectedPassengerToRemove(null);
          }}
          loading={removePassengerMutation.isPending}
        />
      </Box>
    </FullLayout>
  );
}
