'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { passengersApi, groupsApi } from '@/lib/api';

interface PassengerEditModalProps {
  open: boolean;
  passenger: any;
  onClose: () => void;
}

export default function PassengerEditModal({
  open,
  passenger,
  onClose,
}: PassengerEditModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    passportNo: '',
    nationality: '',
    gender: '',
    groupId: '',
    notes: '',
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups-list'],
    queryFn: () => groupsApi.getAll({ limit: 100 }).then((res) => res.data),
  });

  useEffect(() => {
    if (passenger) {
      setFormData({
        firstName: passenger.firstName || '',
        lastName: passenger.lastName || '',
        phone: passenger.phone || '',
        passportNo: passenger.passportNo || '',
        nationality: passenger.nationality || '',
        gender: passenger.gender || '',
        groupId: passenger.groupId || '',
        notes: passenger.notes || '',
      });
    }
  }, [passenger]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => passengersApi.update(passenger.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passenger', passenger.id] });
      toast.success('Yolcu guncellendi');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Guncelleme hatasi');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      groupId: formData.groupId || undefined,
    };
    updateMutation.mutate(data);
  };

  const groups = groupsData?.data || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Yolcu Duzenle</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Ad"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Soyad"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Pasaport No"
                value={formData.passportNo}
                onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                fullWidth
              />
              <TextField
                label="Uyruk"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Cinsiyet</InputLabel>
                <Select
                  value={formData.gender}
                  label="Cinsiyet"
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value="">Belirtilmemis</MenuItem>
                  <MenuItem value="MALE">Erkek</MenuItem>
                  <MenuItem value="FEMALE">Kadin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Grup</InputLabel>
                <Select
                  value={formData.groupId}
                  label="Grup"
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
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
            <TextField
              label="Notlar"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            Iptal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
