'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Autocomplete,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SendMailPage() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [senderAccountId, setSenderAccountId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [useHtml, setUseHtml] = useState(false);
  
  // Manual recipients
  const [manualRecipients, setManualRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  
  // Group selection
  const [selectedGroupId, setSelectedGroupId] = useState('');
  
  // Passenger selection
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([]);

  // Add sender dialog
  const [addSenderOpen, setAddSenderOpen] = useState(false);
  const [newSender, setNewSender] = useState({
    name: '',
    email: '',
    password: '',
    smtpHost: '',
    smtpPort: 587,
    isDefault: false,
  });

  // Fetch sender accounts
  const { data: senderAccounts = [], isLoading: sendersLoading, refetch: refetchSenders } = useQuery({
    queryKey: ['sender-accounts'],
    queryFn: async () => {
      const res = await api.get('/sender-accounts');
      return res.data;
    },
  });

  // Fetch groups
  const { data: groupsData } = useQuery({
    queryKey: ['groups-for-send'],
    queryFn: async () => {
      const res = await api.get('/groups?limit=100');
      return res.data;
    },
  });

  // Fetch passengers
  const { data: passengersData } = useQuery({
    queryKey: ['passengers-for-send'],
    queryFn: async () => {
      const res = await api.get('/passengers?limit=500');
      return res.data;
    },
  });

  // Add sender mutation
  const addSenderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sender-accounts', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Gonderici hesabi eklendi');
      setAddSenderOpen(false);
      setNewSender({ name: '', email: '', password: '', smtpHost: '', smtpPort: 587, isDefault: false });
      queryClient.invalidateQueries({ queryKey: ['sender-accounts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata olustu');
    },
  });

  // Delete sender mutation
  const deleteSenderMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sender-accounts/${id}`);
    },
    onSuccess: () => {
      toast.success('Gonderici hesabi silindi');
      queryClient.invalidateQueries({ queryKey: ['sender-accounts'] });
      if (senderAccounts.length === 1) {
        setSenderAccountId('');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Silinemedi');
    },
  });

  // Send mutations
  const sendManualMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/emails/send', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.successCount} e-posta gonderildi!`);
      if (data.failedCount > 0) {
        toast.error(`${data.failedCount} e-posta gonderilemedi`);
      }
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gonderim hatasi');
    },
  });

  const sendGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/emails/send/group', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.successCount} e-posta gonderildi!`);
      if (data.failedCount > 0) {
        toast.error(`${data.failedCount} e-posta gonderilemedi`);
      }
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gonderim hatasi');
    },
  });

  const sendPassengersMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/emails/send/passengers', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.successCount} e-posta gonderildi!`);
      if (data.failedCount > 0) {
        toast.error(`${data.failedCount} e-posta gonderilemedi`);
      }
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gonderim hatasi');
    },
  });

  // Test SMTP
  const testSmtpMutation = useMutation({
    mutationFn: async (senderAccountId: string) => {
      const res = await api.post('/emails/send/test', { senderAccountId });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'SMTP test hatasi');
    },
  });

  const resetForm = () => {
    setSubject('');
    setContent('');
    setManualRecipients([]);
    setSelectedGroupId('');
    setSelectedPassengerIds([]);
  };

  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (email && email.includes('@') && !manualRecipients.includes(email)) {
      setManualRecipients([...manualRecipients, email]);
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setManualRecipients(manualRecipients.filter(r => r !== email));
  };

  const handleSend = () => {
    if (!senderAccountId) {
      toast.error('Lutfen gonderici hesap secin');
      return;
    }
    if (!subject.trim()) {
      toast.error('Lutfen konu girin');
      return;
    }
    if (!content.trim()) {
      toast.error('Lutfen icerik girin');
      return;
    }

    const mailContent = useHtml ? { html: content } : { text: content };

    switch (tabValue) {
      case 0:
        if (manualRecipients.length === 0) {
          toast.error('Lutfen en az bir alici ekleyin');
          return;
        }
        sendManualMutation.mutate({
          senderAccountId,
          recipients: manualRecipients,
          subject,
          ...mailContent,
        });
        break;
      case 1:
        if (!selectedGroupId) {
          toast.error('Lutfen bir grup secin');
          return;
        }
        sendGroupMutation.mutate({
          senderAccountId,
          groupId: selectedGroupId,
          subject,
          ...mailContent,
        });
        break;
      case 2:
        if (selectedPassengerIds.length === 0) {
          toast.error('Lutfen en az bir yolcu secin');
          return;
        }
        sendPassengersMutation.mutate({
          senderAccountId,
          passengerIds: selectedPassengerIds,
          subject,
          ...mailContent,
        });
        break;
    }
  };

  const isSending = sendManualMutation.isPending || sendGroupMutation.isPending || sendPassengersMutation.isPending;
  const groups = groupsData?.data || [];
  const passengers = passengersData?.data?.filter((p: any) => p.email?.address) || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        E-posta Gonder
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Yolculara veya gruplara toplu e-posta gonderin
      </Typography>

      <Grid container spacing={3}>
        {/* Sol Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Gonderici Secimi */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Gonderici Hesap</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setAddSenderOpen(true)}
                  >
                    Yeni Hesap Ekle
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gonderici Secin</InputLabel>
                    <Select
                      value={senderAccountId}
                      onChange={(e) => setSenderAccountId(e.target.value)}
                      label="Gonderici Secin"
                    >
                      {senderAccounts.map((account: any) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.name} ({account.email})
                          {account.isDefault && ' - Varsayilan'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title="SMTP Test Et">
                    <IconButton
                      onClick={() => senderAccountId && testSmtpMutation.mutate(senderAccountId)}
                      disabled={!senderAccountId || testSmtpMutation.isPending}
                    >
                      {testSmtpMutation.isPending ? <CircularProgress size={20} /> : <RefreshIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
                {senderAccounts.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Henuz gonderici hesap eklenmemis. Lutfen bir hesap ekleyin.
                  </Alert>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Alici Secimi Tabs */}
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
                <Tab icon={<EmailIcon />} label="Manuel" iconPosition="start" />
                <Tab icon={<GroupIcon />} label="Gruba Gonder" iconPosition="start" />
                <Tab icon={<PersonIcon />} label="Yolculara Gonder" iconPosition="start" />
              </Tabs>

              {/* Tab 0: Manuel */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="E-posta Adresi"
                    placeholder="ornek@mail.com"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                  />
                  <Button variant="outlined" onClick={handleAddRecipient}>
                    Ekle
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {manualRecipients.map((email) => (
                    <Chip
                      key={email}
                      label={email}
                      onDelete={() => handleRemoveRecipient(email)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                {manualRecipients.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {manualRecipients.length} alici secildi
                  </Typography>
                )}
              </TabPanel>

              {/* Tab 1: Grup */}
              <TabPanel value={tabValue} index={1}>
                <FormControl fullWidth size="small">
                  <InputLabel>Grup Secin</InputLabel>
                  <Select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    label="Grup Secin"
                  >
                    {groups.map((group: any) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name} ({group._count?.passengers || 0} yolcu)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TabPanel>

              {/* Tab 2: Yolcular */}
              <TabPanel value={tabValue} index={2}>
                <Autocomplete
                  multiple
                  options={passengers}
                  getOptionLabel={(option: any) => 
                    `${option.firstName} ${option.lastName} (${option.email?.address})`
                  }
                  value={passengers.filter((p: any) => selectedPassengerIds.includes(p.id))}
                  onChange={(_, newValue) => {
                    setSelectedPassengerIds(newValue.map((p: any) => p.id));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Yolcu Secin" size="small" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option: any, index) => (
                      <Chip
                        label={`${option.firstName} ${option.lastName}`}
                        {...getTagProps({ index })}
                        key={option.id}
                        size="small"
                      />
                    ))
                  }
                />
              </TabPanel>

              <Divider sx={{ my: 3 }} />

              {/* Icerik */}
              <TextField
                fullWidth
                label="Konu"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <Button
                  size="small"
                  variant={useHtml ? 'contained' : 'outlined'}
                  onClick={() => setUseHtml(!useHtml)}
                  sx={{ mb: 1 }}
                >
                  {useHtml ? 'HTML Modu' : 'Duz Metin'}
                </Button>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={8}
                label={useHtml ? 'HTML Icerik' : 'Mesaj'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={useHtml ? '<h1>Merhaba</h1><p>Icerik...</p>' : 'Mesajinizi yazin...'}
              />

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={resetForm} disabled={isSending}>
                  Temizle
                </Button>
                <Button
                  variant="contained"
                  startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  onClick={handleSend}
                  disabled={isSending || !senderAccountId}
                  size="large"
                >
                  {isSending ? 'Gonderiliyor...' : 'Gonder'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sag Panel - Gonderici Hesaplar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gonderici Hesaplari
              </Typography>
              {senderAccounts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Henuz hesap eklenmemis
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {senderAccounts.map((account: any) => (
                    <Box
                      key={account.id}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2">{account.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account.email}
                        </Typography>
                        {account.isDefault && (
                          <Chip label="Varsayilan" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (confirm('Bu hesabi silmek istediginize emin misiniz?')) {
                            deleteSenderMutation.mutate(account.id);
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kullanim Ipuclari
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Gmail icin Uygulama Sifresi kullanin
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  E-postalar arasi 1sn bekleme suresi var
                </Typography>
                <Typography component="li" variant="body2">
                  SMTP testini gondermeden once yapin
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Yeni Gonderici Ekleme Dialog */}
      <Dialog open={addSenderOpen} onClose={() => setAddSenderOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Gonderici Hesabi Ekle</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Hesap Adi"
              placeholder="Uzman Umre"
              value={newSender.name}
              onChange={(e) => setNewSender({ ...newSender, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="E-posta Adresi"
              placeholder="info@uzmanumre.com"
              value={newSender.email}
              onChange={(e) => setNewSender({ ...newSender, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="SMTP Sifresi"
              type="password"
              value={newSender.password}
              onChange={(e) => setNewSender({ ...newSender, password: e.target.value })}
              fullWidth
              helperText="Gmail icin Uygulama Sifresi kullanin"
            />
            <TextField
              label="SMTP Sunucu (Opsiyonel)"
              placeholder="smtp.gmail.com"
              value={newSender.smtpHost}
              onChange={(e) => setNewSender({ ...newSender, smtpHost: e.target.value })}
              fullWidth
              helperText="Bos birakirsaniz varsayilan sunucu kullanilir"
            />
            <TextField
              label="SMTP Port"
              type="number"
              value={newSender.smtpPort}
              onChange={(e) => setNewSender({ ...newSender, smtpPort: parseInt(e.target.value) || 587 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSenderOpen(false)}>Iptal</Button>
          <Button
            variant="contained"
            onClick={() => addSenderMutation.mutate(newSender)}
            disabled={!newSender.name || !newSender.email || !newSender.password || addSenderMutation.isPending}
          >
            {addSenderMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
