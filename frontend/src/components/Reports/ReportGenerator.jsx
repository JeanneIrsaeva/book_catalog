import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import DownloadIcon from '@mui/icons-material/Download';
import { toast } from 'react-toastify';
import { reportService } from '../../services/reports';

const ReportGenerator = () => {
  const [reportType, setReportType] = useState('book_card');
  const [bookId, setBookId] = useState('');
  const [periodFrom, setPeriodFrom] = useState(null);
  const [periodTo, setPeriodTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    if (reportType === 'book_card' && !bookId) {
      setError('Введите ID книги');
      return;
    }

    if (reportType === 'collection_growth' && (!periodFrom || !periodTo)) {
      setError('Выберите период');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let blob;
      if (reportType === 'book_card') {
        blob = await reportService.downloadBookCard(bookId);
      } else {
        blob = await reportService.downloadCollectionGrowth(periodFrom, periodTo);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${new Date().toISOString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Отчет сгенерирован и скачан');
    } catch (err) {
      setError('Ошибка генерации отчета');
      toast.error('Ошибка генерации отчета');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} locale={ru}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Генерация отчетов
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Тип отчета</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Тип отчета"
              >
                <MenuItem value="book_card">Карточка книги</MenuItem>
                <MenuItem value="collection_growth">Пополнение коллекции</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {reportType === 'book_card' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ID книги"
                type="number"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
              />
            </Grid>
          )}

          {reportType === 'collection_growth' && (
            <>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Период с"
                  value={periodFrom}
                  onChange={(newValue) => setPeriodFrom(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Период по"
                  value={periodTo}
                  onChange={(newValue) => setPeriodTo(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={handleGenerateReport}
              disabled={loading}
              fullWidth
            >
              Сгенерировать и скачать отчет
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};

export default ReportGenerator;