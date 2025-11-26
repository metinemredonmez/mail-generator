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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  IconPlus,
  IconSearch,
  IconMail,
  IconTrash,
  IconEye,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { passengersApi, emailsApi, groupsApi } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'; icon: any }> = {
  PENDING: { label: 'Bekliyor', color: 'default', icon: IconClock },
  EMAIL_CREATED: { label: 'E-posta Olusturuldu', color: 'info', icon: IconMail },
  CODE_RECEIVED: { label: 'Kod Alindi', color: 'warning', icon: IconAlertCircle },
  ACCOUNT_VERIFIED: { label: 'Dogrulandi', color: 'success', icon: IconCircleCheck },
  COMPLETED: { label: 'Tamamlandi', color: 'success', icon: IconCircleCheck },
  FAILED: { label: 'Hata', color: 'error', icon: IconAlertCircle },
};

export default function PassengersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [newPassenger, setNewPassenger] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    passportNo: '',
    nationality: 'TR',
    gender: 'MALE',
    groupId: '',
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups-list'],
    queryFn: () => groupsApi.getAll({ limit: 100 }).then((res) => res.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['passengers', { search, page: paginationModel.page + 1, groupId: selectedGroup }],
    queryFn: () =>
      passengersApi
        .getAll({
          search,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          groupId: selectedGroup || undefined,
        })
        .then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: passengersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-stats'] });
      toast.success('Yolcu eklendi');
      setShowAddModal(false);
      setNewPassenger({
        firstName: '',
        lastName: '',
        phone: '',
        passportNo: '',
        nationality: 'TR',
        gender: 'MALE',
        groupId: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: passengersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-stats'] });
      toast.success('Yolcu silindi');
    },
  });

  const createEmailMutation = useMutation({
    mutationFn: (passengerId: string) => emailsApi.createForPassenger(passengerId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-stats'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      toast.success(
        `E-posta olusturuldu: ${response.data.address}\nSifre: ${response.data.plainPassword}`,
        { duration: 10000 }
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'E-posta olusturulamadi');
    },
  });

  const handleAddPassenger = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...newPassenger,
      groupId: newPassenger.groupId || undefined,
    };
    createMutation.mutate(data);
  };

  const groups = groupsData?.data || [];

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
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'group',
      headerName: 'Grup',
      width: 150,
      renderCell: (params: GridRenderCellParams) =>
        params.row.group ? (
          <Chip label={params.row.group.name} size="small" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
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
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                {params.row.email.address}
              </Typography>
              {params.row.email._count?.inboxItems > 0 && (
                <Chip
                  label={params.row.email._count.inboxItems}
                  size="small"
                  color="primary"
                />
              )}
            </Stack>
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
          <IconButton
            size="small"
            color="primary"
            onClick={() => (window.location.href = `/passengers/${params.row.id}`)}
          >
            <IconEye size={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              if (confirm('Bu yolcuyu silmek istediginize emin misiniz?')) {
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
              Yolcular
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Yolcu kayitlarini yonetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => setShowAddModal(true)}
          >
            Yolcu Ekle
          </Button>
        </Stack>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                placeholder="Yolcu ara (ad, soyad, pasaport no)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Grup</InputLabel>
                <Select
                  value={selectedGroup}
                  label="Grup"
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <MenuItem value="">Tum Gruplar</MenuItem>
                  {groups.map((group: any) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* Data Table */}
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

        {/* Add Modal */}
        <Dialog
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Yeni Yolcu Ekle</DialogTitle>
          <form onSubmit={handleAddPassenger}>
            <DialogContent>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Ad"
                    value={newPassenger.firstName}
                    onChange={(e) =>
                      setNewPassenger({ ...newPassenger, firstName: e.target.value })
                    }
                    required
                    fullWidth
                  />
                  <TextField
                    label="Soyad"
                    value={newPassenger.lastName}
                    onChange={(e) =>
                      setNewPassenger({ ...newPassenger, lastName: e.target.value })
                    }
                    required
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Telefon"
                  value={newPassenger.phone}
                  onChange={(e) =>
                    setNewPassenger({ ...newPassenger, phone: e.target.value })
                  }
                  fullWidth
                />
                <TextField
                  label="Pasaport No"
                  value={newPassenger.passportNo}
                  onChange={(e) =>
                    setNewPassenger({ ...newPassenger, passportNo: e.target.value })
                  }
                  fullWidth
                />
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Cinsiyet</InputLabel>
                    <Select
                      value={newPassenger.gender}
                      label="Cinsiyet"
                      onChange={(e) =>
                        setNewPassenger({ ...newPassenger, gender: e.target.value })
                      }
                    >
                      <MenuItem value="MALE">Erkek</MenuItem>
                      <MenuItem value="FEMALE">Kadin</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Grup</InputLabel>
                    <Select
                      value={newPassenger.groupId}
                      label="Grup"
                      onChange={(e) =>
                        setNewPassenger({ ...newPassenger, groupId: e.target.value })
                      }
                    >
                      <MenuItem value="">Grup Yok</MenuItem>
                      {groups.map((group: any) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button variant="outlined" onClick={() => setShowAddModal(false)}>
                Iptal
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
              >
                Kaydet
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </FullLayout>
  );
}
