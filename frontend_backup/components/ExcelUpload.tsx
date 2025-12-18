'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  IconUpload,
  IconFileSpreadsheet,
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconDownload,
} from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';
import { passengersImportApi } from '@/lib/api';

interface ExcelUploadProps {
  groupId?: string;
  onSuccess?: (result: ImportResult) => void;
  onClose?: () => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
  passengers: any[];
}

export default function ExcelUpload({ groupId, onSuccess, onClose }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await passengersImportApi.uploadExcel(file, groupId);
      setResult(response.data);
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Dosya yuklenirken hata olustu');
    } finally {
      setUploading(false);
    }
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
    } catch (err) {
      console.error('Template download error:', err);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <Box>
      {/* Download Template */}
      <Button
        variant="text"
        startIcon={<IconDownload size={18} />}
        onClick={handleDownloadTemplate}
        sx={{ mb: 2 }}
      >
        Ornek Sablon Indir
      </Button>

      {/* Dropzone */}
      {!file && (
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          <input {...getInputProps()} />
          <IconUpload size={48} color="#666" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {isDragActive ? 'Dosyayi birakin...' : 'Excel dosyasini surukleyin'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            veya dosya secmek icin tiklayin
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Desteklenen formatlar: .xlsx, .xls, .csv (max 5MB)
          </Typography>
        </Paper>
      )}

      {/* Selected File */}
      {file && !result && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconFileSpreadsheet size={40} color="#4caf50" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(file.size / 1024).toFixed(1)} KB
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={clearFile}
              startIcon={<IconX size={16} />}
            >
              Kaldir
            </Button>
          </Stack>

          {uploading && <LinearProgress sx={{ mt: 2 }} />}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              startIcon={<IconUpload size={18} />}
            >
              {uploading ? 'Yukleniyor...' : 'Yukle ve Aktar'}
            </Button>
            {onClose && (
              <Button variant="outlined" onClick={onClose} disabled={uploading}>
                Iptal
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* Result */}
      {result && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <IconCheck size={32} color="#4caf50" />
            <Box>
              <Typography variant="h6">Aktarim Tamamlandi</Typography>
              <Typography variant="body2" color="text.secondary">
                {result.imported} yolcu eklendi
                {result.skipped > 0 && `, ${result.skipped} satir atlandi`}
              </Typography>
            </Box>
          </Stack>

          {result.errors.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Atilan Satirlar:
              </Typography>
              <List dense sx={{ py: 0 }}>
                {result.errors.slice(0, 5).map((err, idx) => (
                  <ListItem key={idx} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <IconAlertTriangle size={16} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Satir ${err.row}: ${err.message}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
                {result.errors.length > 5 && (
                  <ListItem sx={{ py: 0 }}>
                    <ListItemText
                      primary={`...ve ${result.errors.length - 5} hata daha`}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Alert>
          )}

          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={clearFile}>
              Yeni Dosya Yukle
            </Button>
            {onClose && (
              <Button variant="outlined" onClick={onClose}>
                Kapat
              </Button>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
