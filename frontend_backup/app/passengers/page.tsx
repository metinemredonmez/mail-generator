'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  Checkbox,
  Tooltip,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel, GridRowModel } from '@mui/x-data-grid';
import {
  IconPlus,
  IconSearch,
  IconMail,
  IconTrash,
  IconEye,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconUpload,
  IconDownload,
  IconEdit,
  IconMailPlus,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { passengersApi, emailsApi, groupsApi, passengersImportApi } from '@/lib/api';
import ExcelUpload from '@/components/ExcelUpload';
import ConfirmDialog from '@/components/ConfirmDialog';
import PassengerEditModal from '@/components/PassengerEditModal';

const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'; icon: any }> = {
  PENDING: { label: 'Bekliyor', color: 'default', icon: IconClock },
  EMAIL_CREATED: { label: 'E-posta Olusturuldu', color: 'info', icon: IconMail },
  CODE_RECEIVED: { label: 'Kod Alindi', color: 'warning', icon: IconAlertCircle },
  ACCOUNT_VERIFIED: { label: 'Dogrulandi', color: 'success', icon: IconCircleCheck },
  COMPLETED: { label: 'Tamamlandi', color: 'success', icon: IconCircleCheck },
  FAILED: { label: 'Hata', color: 'error', icon: IconAlertCircle },
};

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function PassengersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['passengers', { search: debouncedSearch, page: paginationModel.page + 1, groupId: selectedGroup }],
    queryFn: () =>
      passengersApi
        .getAll({
          search: debouncedSearch,
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => passengersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      toast.success('Yolcu guncellendi');
      setShowEditModal(false);
      setSelectedPassenger(null);
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
      setShowDeleteConfirm(false);
      setSelectedPassenger(null);
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

  const bulkCreateEmailMutation = useMutation({
    mutationFn: (passengerIds: string[]) => emailsApi.bulkCreate({ passengerIds }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-stats'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      const { created, failed } = response.data;
      toast.success(`${created} e-posta olusturuldu${failed > 0 ? `, ${failed} basarisiz` : ''}`, {
        duration: 5000,
      });
      setSelectedRows([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Toplu e-posta olusturulamadi');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => passengersApi.bulkDelete(ids),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-stats'] });
      const deleted = response.data?.deleted || selectedRows.length;
      toast.success(`${deleted} yolcu silindi`);
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Toplu silme basarisiz');
    },
  });

  const handleAddPassenger = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      firstName: newPassenger.firstName,
      lastName: newPassenger.lastName,
      phone: newPassenger.phone || undefined,
      passportNo: newPassenger.passportNo || undefined,
      nationality: newPassenger.nationality,
      gender: newPassenger.gender,
    };
    // Sadece gecerli UUID varsa groupId ekle
    if (newPassenger.groupId && newPassenger.groupId.length > 0) {
      data.groupId = newPassenger.groupId;
    }
    createMutation.mutate(data);
  };

  const handleEditClick = (passenger: any) => {
    setSelectedPassenger(passenger);
    setShowEditModal(true);
  };

  const handleDeleteClick = (passenger: any) => {
    setSelectedPassenger(passenger);
    setShowDeleteConfirm(true);
  };

  const handleBulkCreateEmail = () => {
    const passengerIds = selectedRows as string[];
    // Filter only passengers without email
    const passengersWithoutEmail = data?.data?.filter(
      (p: any) => passengerIds.includes(p.id) && !p.email
    );
    if (passengersWithoutEmail?.length > 0) {
      bulkCreateEmailMutation.mutate(passengersWithoutEmail.map((p: any) => p.id));
    } else {
      toast.error('Secili yolcularin hepsinde zaten e-posta var');
    }
  };

  const handleImportSuccess = () => {
    setShowImportModal(false);
    queryClient.invalidateQueries({ queryKey: ['passengers'] });
    queryClient.invalidateQueries({ queryKey: ['passenger-stats'] });
    toast.success('Yolcular basariyla iceride');
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await passengersImportApi.downloadTemplate();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yolcu_sablonu.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Sablon indirilemedi');
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.loading('Excel dosyasi hazirlaniyor...', { id: 'export' });
      const response = await passengersApi.export({
        groupId: selectedGroup || undefined,
        format: 'xlsx'
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `yolcular_${date}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel dosyasi indirildi', { id: 'export' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Export basarisiz', { id: 'export' });
    }
  };

  const handleBulkDelete = () => {
    const ids = selectedRows as string[];
    if (ids.length > 0) {
      bulkDeleteMutation.mutate(ids);
    }
  };

  // Inline edit handler
  const processRowUpdate = useCallback(
    async (newRow: GridRowModel, oldRow: GridRowModel) => {
      // Validation - Ad ve Soyad bos olamaz
      if (!newRow.firstName || newRow.firstName.trim() === '') {
        toast.error('Ad alani bos olamaz');
        return oldRow;
      }
      if (!newRow.lastName || newRow.lastName.trim() === '') {
        toast.error('Soyad alani bos olamaz');
        return oldRow;
      }

      // Sadece degisen alanları gonder
      const changes: any = {};
      if (newRow.firstName !== oldRow.firstName) changes.firstName = newRow.firstName.trim();
      if (newRow.lastName !== oldRow.lastName) changes.lastName = newRow.lastName.trim();
      if (newRow.phone !== oldRow.phone) changes.phone = newRow.phone;
      if (newRow.passportNo !== oldRow.passportNo) changes.passportNo = newRow.passportNo;
      if (newRow.groupId !== oldRow.groupId) changes.groupId = newRow.groupId || null;

      if (Object.keys(changes).length === 0) {
        return oldRow; // Degisiklik yoksa eski row'u dondur
      }

      try {
        await passengersApi.update(newRow.id, changes);
        toast.success('Guncellendi');
        queryClient.invalidateQueries({ queryKey: ['passengers'] });
        return newRow;
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Guncelleme hatasi');
        return oldRow; // Hata varsa eski row'a geri don
      }
    },
    [queryClient]
  );

  const groups = groupsData?.data || [];

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'firstName',
      headerName: 'Ad',
      width: 120,
      editable: true,
    },
    {
      field: 'lastName',
      headerName: 'Soyad',
      width: 120,
      editable: true,
    },
    {
      field: 'groupId',
      headerName: 'Grup',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <FormControl size="small" fullWidth variant="standard">
          <Select
            value={params.row.groupId || ''}
            onChange={async (e) => {
              const newGroupId = e.target.value || null;
              try {
                await passengersApi.update(params.row.id, { groupId: newGroupId });
                toast.success('Grup güncellendi');
                queryClient.invalidateQueries({ queryKey: ['passengers'] });
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Hata');
              }
            }}
            disableUnderline
            sx={{
              '& .MuiSelect-select': { py: 0.5 },
              '& .MuiSvgIcon-root': { opacity: 0.5 }
            }}
          >
            <MenuItem value="">
              <Typography color="text.secondary">Grup Yok</Typography>
            </MenuItem>
            {groups.map((g: any) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      ),
    },
    {
      field: 'phone',
      headerName: 'Telefon',
      width: 140,
      editable: true,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'passportNo',
      headerName: 'Pasaport No',
      width: 140,
      editable: true,
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
      width: 130,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Goruntule">
            <IconButton
              size="small"
              color="primary"
              onClick={() => (window.location.href = `/passengers/${params.row.id}`)}
            >
              <IconEye size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duzenle">
            <IconButton
              size="small"
              color="info"
              onClick={() => handleEditClick(params.row)}
            >
              <IconEdit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(params.row)}
            >
              <IconTrash size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [groups, createEmailMutation.isPending]);

  const selectedCount = selectedRows.length;
  const selectedWithoutEmail = data?.data?.filter(
    (p: any) => (selectedRows as string[]).includes(p.id) && !p.email
  ).length || 0;

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
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconFileSpreadsheet size={20} />}
              onClick={handleExportExcel}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconDownload size={20} />}
              onClick={handleDownloadTemplate}
            >
              Sablon
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconUpload size={20} />}
              onClick={() => setShowImportModal(true)}
            >
              Excel Yukle
            </Button>
            <Button
              variant="contained"
              startIcon={<IconPlus size={20} />}
              onClick={() => setShowAddModal(true)}
            >
              Yolcu Ekle
            </Button>
          </Stack>
        </Stack>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<IconMailPlus size={16} />}
                  onClick={handleBulkCreateEmail}
                  disabled={selectedWithoutEmail === 0 || bulkCreateEmailMutation.isPending}
                >
                  {selectedWithoutEmail} Kisi Icin Mail Olustur
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<IconTrash size={16} />}
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  {selectedCount} Yolcu Sil
                </Button>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setSelectedRows([])}
                >
                  Secimi Temizle
                </Button>
              </Stack>
            }
          >
            {selectedCount} yolcu secildi
          </Alert>
        )}

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
              checkboxSelection
              rowSelectionModel={selectedRows}
              onRowSelectionModelChange={setSelectedRows}
              processRowUpdate={processRowUpdate}
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

        {/* Import Modal */}
        <Dialog
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Excel ile Yolcu Yukle</DialogTitle>
          <DialogContent>
            <ExcelUpload
              onSuccess={handleImportSuccess}
              groupId={selectedGroup || undefined}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="outlined" onClick={() => setShowImportModal(false)}>
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Modal */}
        <PassengerEditModal
          open={showEditModal}
          passenger={selectedPassenger}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPassenger(null);
          }}
        />

        {/* Delete Confirm */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Yolcu Sil"
          message={`"${selectedPassenger?.firstName} ${selectedPassenger?.lastName}" isimli yolcuyu silmek istediginize emin misiniz?`}
          confirmText="Sil"
          confirmColor="error"
          onConfirm={() => {
            if (selectedPassenger) {
              deleteMutation.mutate(selectedPassenger.id);
            }
          }}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedPassenger(null);
          }}
          loading={deleteMutation.isPending}
        />

        {/* Bulk Delete Confirm */}
        <ConfirmDialog
          open={showBulkDeleteConfirm}
          title="Toplu Yolcu Sil"
          message={`${selectedRows.length} yolcuyu silmek istediginize emin misiniz? Bu islem geri alinamaz.`}
          confirmText={`${selectedRows.length} Yolcu Sil`}
          confirmColor="error"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          loading={bulkDeleteMutation.isPending}
        />
      </Box>
    </FullLayout>
  );
}
