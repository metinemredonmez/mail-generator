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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  IconActivity,
  IconRefresh,
  IconTrash,
  IconFilter,
  IconUser,
  IconMail,
  IconUsers,
  IconSettings,
  IconPlus,
  IconEdit,
  IconTrashX,
  IconLogin,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import FullLayout from '@/src/layouts/full/FullLayout';
import { activityApi } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';

const actionConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'; icon: any }> = {
  CREATE: { label: 'Olusturma', color: 'success', icon: IconPlus },
  UPDATE: { label: 'Guncelleme', color: 'info', icon: IconEdit },
  DELETE: { label: 'Silme', color: 'error', icon: IconTrashX },
  LOGIN: { label: 'Giris', color: 'primary', icon: IconLogin },
  SYNC: { label: 'Senkronizasyon', color: 'warning', icon: IconRefresh },
};

const entityConfig: Record<string, { label: string; icon: any }> = {
  PASSENGER: { label: 'Yolcu', icon: IconUser },
  EMAIL: { label: 'E-posta', icon: IconMail },
  GROUP: { label: 'Grup', icon: IconUsers },
  SETTING: { label: 'Ayar', icon: IconSettings },
  ADMIN: { label: 'Admin', icon: IconUser },
};

export default function ActivityPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
  });
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activity', { page: page + 1, limit: rowsPerPage, ...filters }],
    queryFn: () =>
      activityApi
        .getAll({
          page: page + 1,
          limit: rowsPerPage,
          action: filters.action || undefined,
          entity: filters.entity || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        })
        .then((res) => res.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['activity-summary'],
    queryFn: () => activityApi.getSummary().then((res) => res.data),
  });

  const cleanupMutation = useMutation({
    mutationFn: (days: number) => activityApi.cleanup(days),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
      toast.success(`${response.data.deleted} kayit silindi`);
      setShowCleanupConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Temizlik basarisiz');
    },
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({ action: '', entity: '', startDate: '', endDate: '' });
    setPage(0);
  };

  const activities = data?.data || [];
  const total = data?.meta?.total || 0;

  return (
    <FullLayout>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Aktivite Loglari
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sistem aktivitelerini izleyin
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={20} />}
              onClick={() => refetch()}
            >
              Yenile
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<IconTrash size={20} />}
              onClick={() => setShowCleanupConfirm(true)}
            >
              Eski Kayitlari Temizle
            </Button>
          </Stack>
        </Stack>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {summary.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {summary.today || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bugun
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {summary.thisWeek || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bu Hafta
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {summary.thisMonth || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bu Ay
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <IconFilter size={20} />
              <Typography variant="subtitle1" fontWeight={600}>
                Filtreler
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Aksiyon</InputLabel>
                  <Select
                    value={filters.action}
                    label="Aksiyon"
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  >
                    <MenuItem value="">Tumu</MenuItem>
                    {Object.entries(actionConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Varlik</InputLabel>
                  <Select
                    value={filters.entity}
                    label="Varlik"
                    onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                  >
                    <MenuItem value="">Tumu</MenuItem>
                    {Object.entries(entityConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Baslangic Tarihi"
                  type="date"
                  size="small"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Bitis Tarihi"
                  type="date"
                  size="small"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleClearFilters}
                  sx={{ height: 40 }}
                >
                  Temizle
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Activity Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : activities.length === 0 ? (
              <Box textAlign="center" py={4}>
                <IconActivity size={48} style={{ opacity: 0.3 }} />
                <Typography color="text.secondary">
                  Aktivite kaydi bulunamadi
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tarih</TableCell>
                        <TableCell>Aksiyon</TableCell>
                        <TableCell>Varlik</TableCell>
                        <TableCell>Varlik ID</TableCell>
                        <TableCell>Admin</TableCell>
                        <TableCell>Detay</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activities.map((activity: any) => {
                        const action = actionConfig[activity.action] || { label: activity.action, color: 'default', icon: IconActivity };
                        const entity = entityConfig[activity.entity] || { label: activity.entity, icon: IconActivity };
                        const ActionIcon = action.icon;
                        const EntityIcon = entity.icon;

                        return (
                          <TableRow key={activity.id} hover>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(activity.createdAt).toLocaleString('tr-TR')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={<ActionIcon size={14} />}
                                label={action.label}
                                size="small"
                                color={action.color}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <EntityIcon size={16} />
                                <Typography variant="body2">{entity.label}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                                {activity.entityId?.substring(0, 8) || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {activity.admin?.name || activity.admin?.email || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 300,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {activity.details ? JSON.stringify(activity.details) : '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  labelRowsPerPage="Sayfa basina:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Cleanup Confirm Dialog */}
        <ConfirmDialog
          open={showCleanupConfirm}
          title="Eski Kayitlari Temizle"
          message={
            <Box>
              <Typography mb={2}>
                Belirtilen gun sayisindan eski tum aktivite kayitlari silinecek. Bu islem geri alinamaz.
              </Typography>
              <TextField
                fullWidth
                label="Kac gunluk kayitlar silinsin?"
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                size="small"
                helperText={`${cleanupDays} gunden eski kayitlar silinecek`}
              />
            </Box>
          }
          confirmText="Temizle"
          confirmColor="error"
          onConfirm={() => cleanupMutation.mutate(cleanupDays)}
          onCancel={() => setShowCleanupConfirm(false)}
          loading={cleanupMutation.isPending}
        />
      </Box>
    </FullLayout>
  );
}
