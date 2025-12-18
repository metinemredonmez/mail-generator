'use client';

import { Component, ReactNode } from 'react';
import { Box, Button, Typography, Stack, Card, CardContent } from '@mui/material';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Hatayi loglayabilirsiniz (console, Sentry, vb.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
          <Card sx={{ maxWidth: 500, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack alignItems="center" spacing={3} textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconAlertTriangle size={40} color="white" />
                </Box>

                <Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Bir hata olustu
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Beklenmeyen bir hata meydana geldi. Lutfen sayfayi yenileyin veya daha sonra tekrar deneyin.
                  </Typography>
                </Box>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Box
                    sx={{
                      width: '100%',
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        m: 0,
                      }}
                    >
                      {this.state.error.message}
                    </Typography>
                  </Box>
                )}

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<IconRefresh size={20} />}
                    onClick={this.handleReload}
                  >
                    Sayfayi Yenile
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={this.handleReset}
                  >
                    Tekrar Dene
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
