'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Alert,
  Grid,
  Tooltip,
  Collapse,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  IconMail,
  IconSearch,
  IconRefresh,
  IconTrash,
  IconCopy,
  IconCircleCheck,
  IconCircleX,
  IconEye,
  IconEyeOff,
  IconKey,
  IconInbox,
  IconLoader2,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { emailsApi, inboxApi, passengersApi } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function EmailsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({});
  const [loadingPasswords, setLoadingPasswords] = useState<Record<string, boolean>>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [lastSyncTime, setLastSyncTime] = useState<string>('--:--:--');

  useEffect(() => {
    setLastSyncTime(new Date().toLocaleTimeString('tr-TR'));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['emails', { search, page: paginationModel.page + 1 }],
    queryFn: () =>
      emailsApi.getAll({ search, page: paginationModel.page + 1, limit: paginationModel.pageSize }).then((res) => res.data),
  });

  const { data: passengersWithoutEmail } = useQuery({
    queryKey: ['passengers-without-email'],
    queryFn: () =>
      passengersApi.getAll({ hasEmail: false, limit: 100 }).then((res) => res.data),
  });

  const syncMutation = useMutation({
    mutationFn: inboxApi.syncEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success('Gelen kutusu senkronize edildi');
    },
    onError: () => {
      toast.error('Senkronizasyon basarisiz');
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: inboxApi.syncAll,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setLastSyncTime(new Date().toLocaleTimeString('tr-TR'));
      toast.success(`${response.data.success} e-posta senkronize edildi`);
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (passengerIds: string[]) => emailsApi.bulkCreate({ passengerIds }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passengers-without-email'] });

      const { success, failed } = response.data;
      toast.success(`${success.length} e-posta olusturuldu${failed.length > 0 ? `, ${failed.length} basarisiz` : ''}`);
      setShowBulkModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: emailsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success('E-posta silindi');
      setShowDeleteConfirm(false);
      setSelectedEmail(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (emailIds: string[]) => emailsApi.bulkDelete({ emailIds }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      const { success, failed } = response.data;
      toast.success(`${success.length} e-posta silindi${failed.length > 0 ? `, ${failed.length} basarisiz` : ''}`);
      setShowBulkDeleteConfirm(false);
      setSelectedRows([]);
    },
    onError: () => {
      toast.error('Toplu silme basarisiz');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      emailsApi.update(id, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success(variables.isActive ? 'E-posta aktif edildi' : 'E-posta pasif edildi', {
        icon: variables.isActive ? '✅' : '⏸️',
      });
    },
    onError: () => {
      toast.error('Durum güncellenemedi');
    },
  });

  const copyToClipboard = (text: string, label: string = 'Metin') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandi!`);
  };

  const handleShowPassword = async (emailId: string) => {
    if (visiblePasswords[emailId]) {
      // Hide password
      setVisiblePasswords((prev) => {
        const newState = { ...prev };
        delete newState[emailId];
        return newState;
      });
      return;
    }

    // Fetch and show password
    setLoadingPasswords((prev) => ({ ...prev, [emailId]: true }));
    try {
      const response = await emailsApi.getCredentials(emailId);
      setVisiblePasswords((prev) => ({ ...prev, [emailId]: response.data.password }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sifre alinamadi');
    } finally {
      setLoadingPasswords((prev) => ({ ...prev, [emailId]: false }));
    }
  };

  const handleBulkCreate = () => {
    const passengerIds = passengersWithoutEmail?.data?.map((p: any) => p.id) || [];
    if (passengerIds.length === 0) {
      toast.error('E-posta olusturulacak yolcu yok');
      return;
    }
    bulkCreateMutation.mutate(passengerIds);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR');
  };

  const columns: GridColDef[] = [
    {
      field: 'address',
      headerName: 'E-posta',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontFamily="monospace">
            {params.value}
          </Typography>
          <Tooltip title="E-posta Kopyala">
            <IconButton size="small" onClick={() => copyToClipboard(params.value, 'E-posta')}>
              <IconCopy size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    {
      field: 'password',
      headerName: 'Sifre',
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const emailId = params.row.id;
        const isVisible = !!visiblePasswords[emailId];
        const isLoading = loadingPasswords[emailId];
        const password = visiblePasswords[emailId];

        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontFamily="monospace" sx={{ minWidth: 80 }}>
              {isVisible ? password : '••••••••'}
            </Typography>
            <Tooltip title={isVisible ? 'Gizle' : 'Goster'}>
              <IconButton
                size="small"
                onClick={() => handleShowPassword(emailId)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <IconKey size={16} className="animate-spin" />
                ) : isVisible ? (
                  <IconEyeOff size={16} />
                ) : (
                  <IconEye size={16} />
                )}
              </IconButton>
            </Tooltip>
            {isVisible && password && (
              <Tooltip title="Sifre Kopyala">
                <IconButton size="small" onClick={() => copyToClipboard(password, 'Sifre')}>
                  <IconCopy size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'passenger',
      headerName: 'Yolcu',
      width: 180,
      renderCell: (params: GridRenderCellParams) =>
        params.row.passenger ? (
          <Typography variant="body2">
            {params.row.passenger.firstName} {params.row.passenger.lastName}
          </Typography>
        ) : (
          '-'
        ),
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value ? 'Pasif yap' : 'Aktif yap'}>
          <Chip
            icon={params.value ? <IconCircleCheck size={14} /> : <IconCircleX size={14} />}
            label={params.value ? 'Aktif' : 'Pasif'}
            size="small"
            color={params.value ? 'success' : 'error'}
            onClick={() => toggleStatusMutation.mutate({ id: params.row.id, isActive: !params.value })}
            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
          />
        </Tooltip>
      ),
    },
    {
      field: '_count',
      headerName: 'Mesaj',
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={<IconInbox size={14} />}
          label={params.row._count?.inboxItems || 0}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'lastChecked',
      headerName: 'Son Kontrol',
      width: 160,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Typography variant="body2" color="text.secondary">
            {formatDate(params.value)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        ),
    },
    {
      field: 'actions',
      headerName: 'Islemler',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Senkronize Et">
            <IconButton
              size="small"
              color="primary"
              onClick={() => syncMutation.mutate(params.row.id)}
              disabled={syncMutation.isPending}
            >
              <IconRefresh size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setSelectedEmail(params.row);
                setShowDeleteConfirm(true);
              }}
            >
              <IconTrash size={18} />
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              E-postalar
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Olusturulan e-posta hesaplarini yonetin
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {selectedRows.length > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<IconTrash size={20} />}
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                {selectedRows.length} E-posta Sil
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={syncAllMutation.isPending ? <IconLoader2 size={20} className="animate-spin" /> : <IconRefresh size={20} />}
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
            >
              {syncAllMutation.isPending ? 'Senkronize Ediliyor...' : 'Tumu Senkronize Et'}
            </Button>
            <Button
              variant="contained"
              startIcon={<IconMail size={20} />}
              onClick={() => setShowBulkModal(true)}
            >
              Toplu E-posta Olustur
            </Button>
          </Stack>
        </Stack>

        {/* Stats */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" color="text.secondary">
                    Toplam E-posta
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {data?.meta?.total || 0}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" color="text.secondary">
                    E-posta Bekleyen
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {passengersWithoutEmail?.meta?.total || 0}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" color="text.secondary">
                    Son Senkronizasyon
                  </Typography>
                  <Typography variant="body2">
                    {lastSyncTime}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              placeholder="E-posta ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <DataGrid
              rows={data?.data || []}
              columns={columns}
              loading={isLoading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 20, 50]}
              rowCount={data?.meta?.total || 0}
              paginationMode="server"
              checkboxSelection
              rowSelectionModel={selectedRows}
              onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection as string[])}
              autoHeight
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: 'action.hover',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Bulk Create Modal */}
        <Dialog
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Toplu E-posta Olustur</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" mb={2}>
              E-postasi olmayan{' '}
              <strong>{passengersWithoutEmail?.meta?.total || 0}</strong> yolcu icin
              e-posta olusturulacak.
            </Typography>
            <Alert severity="warning">
              Bu islem geri alinamaz. E-posta adresleri otomatik olarak
              olusturulacaktir.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="outlined" onClick={() => setShowBulkModal(false)} disabled={bulkCreateMutation.isPending}>
              Iptal
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkCreate}
              disabled={bulkCreateMutation.isPending}
              startIcon={bulkCreateMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {bulkCreateMutation.isPending ? 'E-postalar Olusturuluyor...' : 'Olustur'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="E-posta Sil"
          message={`"${selectedEmail?.address}" e-posta adresini silmek istediginize emin misiniz? Bu islem geri alinamaz.`}
          confirmText="Sil"
          confirmColor="error"
          onConfirm={() => {
            if (selectedEmail) {
              deleteMutation.mutate(selectedEmail.id);
            }
          }}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedEmail(null);
          }}
          loading={deleteMutation.isPending}
          loadingText="E-posta Siliniyor..."
        />

        {/* Bulk Delete Confirm */}
        <ConfirmDialog
          open={showBulkDeleteConfirm}
          title="Toplu E-posta Sil"
          message={`${selectedRows.length} e-posta adresini silmek istediginize emin misiniz? Bu islem geri alinamaz ve mail sunucusundan da silinecektir.`}
          confirmText={`${selectedRows.length} E-posta Sil`}
          confirmColor="error"
          onConfirm={() => {
            bulkDeleteMutation.mutate(selectedRows);
          }}
          onCancel={() => {
            setShowBulkDeleteConfirm(false);
          }}
          loading={bulkDeleteMutation.isPending}
          loadingText="E-postalar Siliniyor..."
        />
      </Box>
    </FullLayout>
  );
}
