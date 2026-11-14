import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Download as DownloadIcon,
  Bookmark as BookmarkIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { bookService } from '../../services/books';
import { reportService } from '../../services/reports';

const BookCard = ({ book, onUpdate, onEdit, onDelete }) => {
  const [statuses, setStatuses] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [statusData, setStatusData] = useState({
    status_id: '',
    start_date: null,
    end_date: null,
    pages_read: '',
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatuses = useCallback(async () => {
    try {
      const data = await bookService.getStatuses();
      setStatuses(data);
      
      // Загружаем текущий статус книги
      const status = await bookService.getBookStatus(book.book_id);
      if (status) {
        setCurrentStatus(status);
        setStatusData(prev => ({ ...prev, status_id: status.status_id }));
      }
      
      // Загружаем историю статусов
      const history = await bookService.getBookStatusHistory(book.book_id);
      setStatusHistory(history);
    } catch (err) {
      console.error('Ошибка загрузки статусов:', err);
    }
  }, [book.book_id]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const handleUpdateStatus = async () => {
    try {
      setError('');
      setStatusLoading(true);

      if (!statusData.status_id) {
        setError('Выберите статус');
        return;
      }

      const statusUpdateData = {
        status_id: parseInt(statusData.status_id)
      };

      if (statusData.pages_read && statusData.pages_read !== '') {
        statusUpdateData.pages_read = parseInt(statusData.pages_read);
      }

      if (statusData.start_date) {
        statusUpdateData.start_date = new Date(statusData.start_date).toISOString().split('T')[0];
      }

      if (statusData.end_date) {
        statusUpdateData.end_date = new Date(statusData.end_date).toISOString().split('T')[0];
      }

      await bookService.updateBookStatus(book.book_id, statusUpdateData);
      toast.success('Статус обновлен');
      setOpenStatusDialog(false);
      
      // Мгновенное обновление UI
      const updatedStatus = statuses.find(s => s.status_id === parseInt(statusData.status_id));
      setCurrentStatus(updatedStatus);
      
      // Загружаем обновленную историю
      const history = await bookService.getBookStatusHistory(book.book_id);
      setStatusHistory(history);

      // Сбрасываем форму
      setStatusData({
        status_id: '',
        start_date: null,
        end_date: null,
        pages_read: ''
      });

    } catch (err) {
      let errorMessage = 'Ошибка обновления статуса';
      if (err.response?.status === 422) {
        errorMessage = 'Ошибка валидации данных';
        if (err.response?.data?.detail) {
          if (Array.isArray(err.response.data.detail)) {
            errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
          } else {
            errorMessage = err.response.data.detail;
          }
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDownloadBookCard = async () => {
    try {
      const blob = await reportService.downloadBookCard(book.book_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book_${book.book_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Карточка книги скачана');
    } catch (err) {
      console.error('Ошибка скачивания карточки:', err);
      toast.error('Ошибка скачивания карточки');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'В планах': 'warning',
      'Читаю': 'info',
      'Прочитано': 'success',
    };
    return colors[status?.name] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('ru-RU');
    } catch (err) {
      return '-';
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Кнопка PDF в правом верхнем углу */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Tooltip title="Скачать PDF">
            <IconButton
              size="small"
              onClick={handleDownloadBookCard}
              sx={{ 
                bgcolor: 'white',
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Заголовок */}
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              lineHeight: 1.3,
              mb: 2,
              pr: 4 // Отступ для кнопки PDF
            }}
          >
            {book.title}
          </Typography>

          {/* Информация о книге */}
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Авторы
              </Typography>
              <Typography variant="body2">
                {book.authors.map(a => `${a.last_name} ${a.first_name}`).join(', ')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Издательство
              </Typography>
              <Typography variant="body2">
                {book.publisher?.name}, {book.published}
              </Typography>
            </Box>

            {/* Жанры */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Жанры
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {book.genres.map((genre) => (
                  <Chip
                    key={genre.genre_id}
                    label={genre.name}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Stack>

          {/* Статус */}
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {currentStatus ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={currentStatus.name}
                  color={getStatusColor(currentStatus)}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                <Tooltip title="История статусов">
                  <IconButton
                    size="small"
                    onClick={() => setOpenHistoryDialog(true)}
                  >
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button
                  size="small"
                  onClick={() => setOpenStatusDialog(true)}
                  sx={{ ml: 'auto' }}
                >
                  Изменить
                </Button>
              </Stack>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<BookmarkIcon />}
                onClick={() => setOpenStatusDialog(true)}
                fullWidth
              >
                Установить статус
              </Button>
            )}
          </Box>
        </CardContent>

        {/* Кнопки действий */}
        <CardActions sx={{ p: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} width="100%">
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => onEdit && onEdit(book)}
              sx={{ flex: 1 }}
            >
              Редактировать
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete && onDelete(book)}
              sx={{ flex: 1 }}
            >
              Удалить
            </Button>
          </Stack>
        </CardActions>
      </Card>

      {/* Диалог изменения статуса */}
      <Dialog 
        open={openStatusDialog} 
        onClose={() => setOpenStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Изменение статуса книги</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} locale={ru}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              <FormControl fullWidth required>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={statusData.status_id}
                  onChange={(e) => setStatusData({...statusData, status_id: e.target.value})}
                  label="Статус *"
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.status_id} value={status.status_id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Дата начала"
                value={statusData.start_date}
                onChange={(newValue) => {
                  if (newValue && !isNaN(new Date(newValue).getTime())) {
                    setStatusData({...statusData, start_date: newValue});
                  } else {
                    setStatusData({...statusData, start_date: null});
                  }
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              
              <DatePicker
                label="Дата окончания"
                value={statusData.end_date}
                onChange={(newValue) => {
                  if (newValue && !isNaN(new Date(newValue).getTime())) {
                    setStatusData({...statusData, end_date: newValue});
                  } else {
                    setStatusData({...statusData, end_date: null});
                  }
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />

              <TextField
                label="Прочитано страниц"
                type="number"
                value={statusData.pages_read}
                onChange={(e) => setStatusData({...statusData, pages_read: e.target.value})}
                inputProps={{ min: 0 }}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Отмена</Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained" 
            disabled={statusLoading}
          >
            {statusLoading ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог истории статусов */}
      <Dialog 
        open={openHistoryDialog} 
        onClose={() => setOpenHistoryDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>История статусов книги</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {statusHistory.length === 0 ? (
              <Typography color="text.secondary" align="center" py={3}>
                История статусов отсутствует
              </Typography>
            ) : (
              statusHistory.map((historyItem, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: index === 0 ? 'primary.light' : 'background.default',
                    border: 1,
                    borderColor: 'divider',
                    backgroundColor: index === 0 ? 'grey.50' : 'background.paper',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {statuses.find(s => s.status_id === historyItem.status_id)?.name || 'Неизвестный статус'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(historyItem.created_date)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      {historyItem.start_date && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Начало
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(historyItem.start_date)}
                          </Typography>
                        </Box>
                      )}
                      {historyItem.end_date && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Окончание
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(historyItem.end_date)}
                          </Typography>
                        </Box>
                      )}
                      {historyItem.pages_read && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Страниц
                          </Typography>
                          <Typography variant="body2">
                            {historyItem.pages_read}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookCard;