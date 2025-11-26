'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Stack,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import {
  IconUsers,
  IconMail,
  IconInbox,
  IconCircleCheck,
  IconArrowUpRight,
  IconUsersGroup,
  IconRefresh,
} from '@tabler/icons-react';
import { FullLayout } from '@/src/layouts/full';
import { passengersApi, emailsApi, inboxApi, groupsApi } from '@/lib/api';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, bgColor, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            sx={{
              bgcolor: bgColor,
              width: 56,
              height: 56,
            }}
          >
            <Box sx={{ color }}>{icon}</Box>
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
}

function QuickAction({ title, description, icon, href, color, bgColor }: QuickActionProps) {
  return (
    <Paper
      component="a"
      href={href}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        textDecoration: 'none',
        bgcolor: bgColor,
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
        {icon}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      <IconArrowUpRight size={20} color="#5A6A85" />
    </Paper>
  );
}

export default function DashboardPage() {
  const { data: passengerStats, refetch: refetchPassengers } = useQuery({
    queryKey: ['passenger-stats'],
    queryFn: () => passengersApi.getStats().then((res) => res.data),
  });

  const { data: emailStats, refetch: refetchEmails } = useQuery({
    queryKey: ['email-stats'],
    queryFn: () => emailsApi.getStats().then((res) => res.data),
  });

  const { data: groupStats } = useQuery({
    queryKey: ['group-stats'],
    queryFn: () => groupsApi.getStats().then((res) => res.data),
  });

  const { data: recentCodes, refetch: refetchCodes } = useQuery({
    queryKey: ['recent-codes'],
    queryFn: () => inboxApi.getAllCodes({ limit: 5 }).then((res) => res.data),
  });

  const handleRefresh = () => {
    refetchPassengers();
    refetchEmails();
    refetchCodes();
  };

  const stats = [
    {
      title: 'Toplam Yolcu',
      value: passengerStats?.totalPassengers || 0,
      icon: <IconUsers size={28} />,
      color: '#5D87FF',
      bgColor: '#ECF2FF',
      subtitle: `${passengerStats?.withEmail || 0} e-posta var`,
    },
    {
      title: 'E-postalar',
      value: emailStats?.totalEmails || 0,
      icon: <IconMail size={28} />,
      color: '#13DEB9',
      bgColor: '#E6FFFA',
      subtitle: `${emailStats?.activeEmails || 0} aktif`,
    },
    {
      title: 'Gruplar',
      value: groupStats?.totalGroups || 0,
      icon: <IconUsersGroup size={28} />,
      color: '#49BEFF',
      bgColor: '#E8F7FF',
      subtitle: 'Toplam grup',
    },
    {
      title: 'Dogrulama Kodlari',
      value: passengerStats?.totalVerificationCodes || 0,
      icon: <IconCircleCheck size={28} />,
      color: '#FFAE1F',
      bgColor: '#FEF5E5',
      subtitle: 'Alinan kod',
    },
  ];

  const quickActions = [
    {
      title: 'Yolcu Ekle',
      description: 'Yeni yolcu kaydi olustur',
      icon: <IconUsers size={24} color="white" />,
      href: '/passengers',
      color: '#5D87FF',
      bgColor: '#ECF2FF',
    },
    {
      title: 'E-posta Olustur',
      description: 'Toplu mail olusturma',
      icon: <IconMail size={24} color="white" />,
      href: '/emails',
      color: '#13DEB9',
      bgColor: '#E6FFFA',
    },
    {
      title: 'Gelen Kutusu',
      description: 'Tum dogrulama kodlari',
      icon: <IconInbox size={24} color="white" />,
      href: '/inbox',
      color: '#FFAE1F',
      bgColor: '#FEF5E5',
    },
  ];

  return (
    <FullLayout>
      <Box>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Uzman Mail Panel - E-posta yonetim sistemine hos geldiniz
            </Typography>
          </Box>
          <IconButton onClick={handleRefresh} color="primary">
            <IconRefresh size={20} />
          </IconButton>
        </Stack>

        {/* Stats Grid */}
        <Grid container spacing={3} mb={4}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} lg={3} key={stat.title}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Verification Codes */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={3}
                >
                  <Typography variant="h6" fontWeight={600}>
                    Son Dogrulama Kodlari
                  </Typography>
                  <Chip label="Son 5" size="small" color="primary" />
                </Stack>

                {recentCodes?.data && recentCodes.data.length > 0 ? (
                  <Stack spacing={2}>
                    {recentCodes.data.map((item: any) => (
                      <Paper
                        key={item.id}
                        sx={{
                          p: 2,
                          bgcolor: 'grey.100',
                          borderRadius: 2,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: 'success.light' }}>
                              <IconCircleCheck size={20} color="#13DEB9" />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {item.passenger?.firstName} {item.passenger?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.email?.address || item.email}
                              </Typography>
                            </Box>
                          </Stack>
                          <Box textAlign="right">
                            <Typography
                              variant="h5"
                              fontWeight={700}
                              fontFamily="monospace"
                              color="success.main"
                            >
                              {item.code}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(item.receivedAt).toLocaleString('tr-TR')}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Box textAlign="center" py={4}>
                    <IconInbox size={48} color="#DFE5EF" />
                    <Typography color="text.secondary" mt={1}>
                      Henuz dogrulama kodu yok
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Hizli Islemler
                </Typography>
                <Stack spacing={2}>
                  {quickActions.map((action) => (
                    <QuickAction key={action.title} {...action} />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </FullLayout>
  );
}
