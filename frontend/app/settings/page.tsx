'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  IconSettings,
  IconMail,
  IconServer,
  IconLock,
  IconRefresh,
  IconPlugConnected,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import FullLayout from '@/src/layouts/full/FullLayout';
import { settingsApi, emailsExtendedApi } from '@/lib/api';

interface Settings {
  mail_provider: string;
  mail_domain: string;
  smtp_host: string;
  smtp_port: string;
  imap_host: string;
  imap_port: string;
  auto_sync: string;
  sync_interval: string;
  session_timeout: string;
}

const defaultSettings: Settings = {
  mail_provider: 'mock',
  mail_domain: 'uzmanumre.com',
  smtp_host: 'mail.uzmanumre.com',
  smtp_port: '587',
  imap_host: 'mail.uzmanumre.com',
  imap_port: '993',
  auto_sync: 'true',
  sync_interval: '5',
  session_timeout: '7',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll().then((res) => res.data),
  });

  useEffect(() => {
    if (settingsData) {
      const loadedSettings: Settings = { ...defaultSettings };
      Object.keys(settingsData).forEach((key) => {
        if (key in loadedSettings) {
          (loadedSettings as any)[key] = settingsData[key];
        }
      });
      setSettings(loadedSettings);
      setHasChanges(false);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: (data: Settings) => settingsApi.bulkUpdate(data as unknown as Record<string, string>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Ayarlar basariyla kaydedildi');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ayarlar kaydedilemedi');
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => emailsExtendedApi.testConnection(),
    onSuccess: (response) => {
      setTestResult(response.data);
      if (response.data.success) {
        toast.success('Baglanti basarili');
      } else {
        toast.error(response.data.message || 'Baglanti basarisiz');
      }
    },
    onError: (error: any) => {
      setTestResult({ success: false, message: error.response?.data?.message || 'Baglanti testi basarisiz' });
      toast.error('Baglanti testi basarisiz');
    },
  });

  const initializeMutation = useMutation({
    mutationFn: () => settingsApi.initialize(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Varsayilan ayarlar yuklendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ayarlar yuklenemedi');
    },
  });

  const handleChange = (field: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
    const value = (e.target as HTMLInputElement).value;
    setSettings({ ...settings, [field]: value });
    setHasChanges(true);
  };

  const handleSwitchChange = (field: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [field]: e.target.checked ? 'true' : 'false' });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
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

  return (
    <FullLayout>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>
            Ayarlar
          </Typography>
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
              color="warning"
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isPending}
            >
              Varsayilanlari Yukle
            </Button>
          </Stack>
        </Stack>

        {hasChanges && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Kaydedilmemis degisiklikler var!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Mail Server Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <IconMail size={24} />
                  <Typography variant="h6" fontWeight={600} ml={1}>
                    E-posta Sunucu Ayarlari
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Mail Provider</InputLabel>
                      <Select
                        value={settings.mail_provider}
                        label="Mail Provider"
                        onChange={(e) => {
                          setSettings({ ...settings, mail_provider: e.target.value });
                          setHasChanges(true);
                        }}
                      >
                        <MenuItem value="mock">Mock (Test)</MenuItem>
                        <MenuItem value="cyberpanel">CyberPanel</MenuItem>
                        <MenuItem value="zoho">Zoho Mail</MenuItem>
                        <MenuItem value="custom">Custom SMTP</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mail Domain"
                      value={settings.mail_domain}
                      onChange={handleChange('mail_domain')}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Host"
                      value={settings.smtp_host}
                      onChange={handleChange('smtp_host')}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Port"
                      value={settings.smtp_port}
                      onChange={handleChange('smtp_port')}
                      size="small"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="IMAP Host"
                      value={settings.imap_host}
                      onChange={handleChange('imap_host')}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="IMAP Port"
                      value={settings.imap_port}
                      onChange={handleChange('imap_port')}
                      size="small"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<IconPlugConnected size={20} />}
                      onClick={() => testConnectionMutation.mutate()}
                      disabled={testConnectionMutation.isPending}
                      fullWidth
                    >
                      {testConnectionMutation.isPending ? 'Test Ediliyor...' : 'Baglanti Test Et'}
                    </Button>
                    {testResult && (
                      <Box mt={1}>
                        <Chip
                          icon={testResult.success ? <IconCheck size={16} /> : <IconX size={16} />}
                          label={testResult.message}
                          color={testResult.success ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* System Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <IconServer size={24} />
                  <Typography variant="h6" fontWeight={600} ml={1}>
                    Sistem Ayarlari
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.auto_sync === 'true'}
                          onChange={handleSwitchChange('auto_sync')}
                        />
                      }
                      label="Otomatik E-posta Senkronizasyonu"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Senkronizasyon Araligi (dakika)"
                      value={settings.sync_interval}
                      onChange={handleChange('sync_interval')}
                      size="small"
                      type="number"
                      disabled={settings.auto_sync !== 'true'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <IconLock size={24} />
                  <Typography variant="h6" fontWeight={600} ml={1}>
                    Guvenlik Ayarlari
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Oturum Suresi (gun)"
                      value={settings.session_timeout}
                      onChange={handleChange('session_timeout')}
                      size="small"
                      type="number"
                      helperText="Kullanici oturumu bu sure sonunda sona erer"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Save Button */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                size="large"
                startIcon={<IconSettings size={20} />}
                onClick={handleSave}
                disabled={saveMutation.isPending || !hasChanges}
              >
                {saveMutation.isPending ? 'Kaydediliyor...' : 'Ayarlari Kaydet'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </FullLayout>
  );
}
