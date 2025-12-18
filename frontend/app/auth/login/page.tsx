'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { IconMail, IconLock, IconLogin } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(formData);
      const { user, token } = response.data;

      login(user, token);
      toast.success('Giris basarili!');
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Giris basarisiz';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 450 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo & Header */}
          <Stack alignItems="center" spacing={2} mb={4}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
              }}
            >
              <IconMail size={32} />
            </Avatar>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Uzman Mail Panel
              </Typography>
              <Typography variant="body1" color="text.secondary">
                E-posta yonetim paneline giris yapin
              </Typography>
            </Box>
          </Stack>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconMail size={20} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Sifre"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconLock size={20} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <IconLogin size={20} />
                  )
                }
              >
                {loading ? 'Giris Yapiliyor...' : 'Giris Yap'}
              </Button>
            </Stack>
          </form>

          {/* Demo Credentials - Sadece development'ta göster */}
          {process.env.NODE_ENV === 'development' && (
            <Box
              sx={{
                mt: 4,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Demo giris bilgileri:
              </Typography>
              <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                admin@mailpanel.com / admin123
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
