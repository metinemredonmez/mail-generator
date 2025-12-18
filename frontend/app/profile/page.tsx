'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  IconUser,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { FullLayout } from '@/src/layouts/full';
import { authApi, api } from '@/lib/api';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Profil bilgilerini getir
  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then((res) => res.data),
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Profil guncelleme
  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string }) => api.put('/auth/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil guncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  // Sifre degistirme
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Sifre degistirildi');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Sifre degistirilemedi');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name: profileData.name });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni sifreler eslesmiyor');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Sifre en az 6 karakter olmali');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <FullLayout>
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" fontWeight={700}>
            Profil
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hesap bilgilerinizi yonetin
          </Typography>
        </Box>

        <Stack spacing={3}>
          {/* Profil Bilgileri */}
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'primary.main',
                    fontSize: '1.5rem',
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {user?.name || 'Admin'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role || 'ADMIN'}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleProfileSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Ad Soyad"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="E-posta"
                    value={profileData.email}
                    disabled
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconMail size={20} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="E-posta adresi degistirilemez"
                  />

                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<IconDeviceFloppy size={20} />}
                      disabled={updateProfileMutation.isPending}
                    >
                      Kaydet
                    </Button>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>

          {/* Sifre Degistir */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                <IconLock size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Sifre Degistir
              </Typography>

              <form onSubmit={handlePasswordSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Mevcut Sifre"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                          >
                            {showCurrentPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Yeni Sifre"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Yeni Sifre (Tekrar)"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    fullWidth
                    error={
                      passwordData.confirmPassword !== '' &&
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                    helperText={
                      passwordData.confirmPassword !== '' &&
                      passwordData.newPassword !== passwordData.confirmPassword
                        ? 'Sifreler eslesmiyor'
                        : ''
                    }
                  />

                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      color="warning"
                      startIcon={<IconLock size={20} />}
                      disabled={
                        changePasswordMutation.isPending ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword
                      }
                    >
                      Sifre Degistir
                    </Button>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>

          {/* Hesap Bilgileri */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Hesap Bilgileri
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Hesap Olusturma
                  </Typography>
                  <Typography variant="body2">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('tr-TR')
                      : '-'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Son Guncelleme
                  </Typography>
                  <Typography variant="body2">
                    {user?.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString('tr-TR')
                      : '-'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Rol
                  </Typography>
                  <Typography variant="body2">{user?.role || 'ADMIN'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </FullLayout>
  );
}
