'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stack,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  IconPlus,
  IconFolder,
  IconUsers,
  IconCalendar,
  IconTrash,
  IconEdit,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { groupsApi } from '@/lib/api';

interface Group {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  _count?: { passengers: number };
  createdAt: string;
}

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getAll().then((r) => r.data),
  });

  const groups = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Grup olusturuldu');
      closeModal();
    },
    onError: () => {
      toast.error('Grup olusturulamadi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Grup guncellendi');
      closeModal();
    },
    onError: () => {
      toast.error('Grup guncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Grup silindi');
    },
    onError: () => {
      toast.error('Grup silinemedi');
    },
  });

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '', startDate: '', endDate: '' });
    setShowModal(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      startDate: group.startDate ? group.startDate.split('T')[0] : '',
      endDate: group.endDate ? group.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setFormData({ name: '', description: '', startDate: '', endDate: '' });
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      description: formData.description || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (group: Group) => {
    if (confirm(`"${group.name}" grubunu silmek istediginize emin misiniz?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
              Gruplar
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tur ve grup yonetimi
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={openCreateModal}
          >
            Yeni Grup
          </Button>
        </Stack>

        {/* Groups Grid */}
        {isLoading ? (
          <Card>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress />
            </CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <IconFolder size={48} color="#DFE5EF" />
              <Typography color="text.secondary" mt={2}>
                Henuz grup olusturulmamis
              </Typography>
              <Button
                variant="contained"
                onClick={openCreateModal}
                sx={{ mt: 2 }}
              >
                Ilk Grubu Olustur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {groups.map((group: Group) => (
              <Grid item xs={12} sm={6} lg={4} key={group.id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: 'primary.light',
                        }}
                      >
                        <IconFolder size={24} color="#5D87FF" />
                      </Avatar>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => openEditModal(group)}
                        >
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(group)}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {group.name}
                    </Typography>

                    {group.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {group.description}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={2} mt="auto">
                      <Chip
                        icon={<IconUsers size={14} />}
                        label={`${group._count?.passengers || 0} Yolcu`}
                        size="small"
                        variant="outlined"
                      />
                      {group.startDate && (
                        <Chip
                          icon={<IconCalendar size={14} />}
                          label={formatDate(group.startDate)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Modal */}
        <Dialog
          open={showModal}
          onClose={closeModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingGroup ? 'Grubu Duzenle' : 'Yeni Grup'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Grup Adi"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ocak 2025 Umre Turu"
                fullWidth
                required
              />
              <TextField
                label="Aciklama"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Istanbul kalkisli umre turu..."
                multiline
                rows={3}
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Baslangic Tarihi"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Bitis Tarihi"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="outlined" onClick={closeModal}>
              Iptal
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <CircularProgress size={20} />
              ) : editingGroup ? (
                'Guncelle'
              ) : (
                'Olustur'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </FullLayout>
  );
}
