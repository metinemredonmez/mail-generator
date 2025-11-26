'use client';

import { useState } from 'react';
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
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { emailsApi, inboxApi, passengersApi } from '@/lib/api';

export default function EmailsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

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
      toast.success(`${response.data.success} e-posta senkronize edildi`);
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (passengerIds: string[]) => emailsApi.bulkCreate(passengerIds),
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
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopyalandi!');
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
          <IconButton size="small" onClick={() => copyToClipboard(params.value)}>
            <IconCopy size={16} />
          </IconButton>
        </Stack>
      ),
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
      width: 120,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip
            icon={<IconCircleCheck size={14} />}
            label="Aktif"
            size="small"
            color="success"
          />
        ) : (
          <Chip
            icon={<IconCircleX size={14} />}
            label="Pasif"
            size="small"
            color="error"
          />
        ),
    },
    {
      field: '_count',
      headerName: 'Mesaj',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.row._count?.inboxItems || 0} size="small" />
      ),
    },
    {
      field: 'lastChecked',
      headerName: 'Son Kontrol',
      width: 180,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? formatDate(params.value) : 'Henuz kontrol edilmedi',
    },
    {
      field: 'actions',
      headerName: 'Islemler',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => syncMutation.mutate(params.row.id)}
            disabled={syncMutation.isPending}
          >
            <IconRefresh size={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              if (confirm('Bu e-postayi silmek istediginize emin misiniz?')) {
                deleteMutation.mutate(params.row.id);
              }
            }}
          >
            <IconTrash size={18} />
          </IconButton>
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
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={20} />}
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
            >
              Tumu Senkronize Et
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
                    {new Date().toLocaleTimeString('tr-TR')}
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
              disableRowSelectionOnClick
              autoHeight
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: 'grey.100',
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
            <Button variant="outlined" onClick={() => setShowBulkModal(false)}>
              Iptal
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkCreate}
              disabled={bulkCreateMutation.isPending}
            >
              {bulkCreateMutation.isPending ? 'Olusturuluyor...' : 'Olustur'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FullLayout>
  );
}
