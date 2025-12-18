import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Функция debounce для предотвращения многократных вызовов
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs для отслеживания состояния загрузки
  const isMounted = useRef(true);
  const loadAbortController = useRef(null);

  // Мемоизированные функции с дебаунсом
  const loadStatuses = useCallback(
    debounce(async () => {
      if (!isMounted.current) return;
      
      try {
        console.log('Загрузка статусов...');
        const data = await bookService.getStatuses();
        if (isMounted.current) {
          setStatuses(data);
          // Устанавливаем текущий статус по умолчанию
          if (currentStatus && data.length > 0) {
            const current = data.find(s => s.status_id === currentStatus.status_id);
            if (current) {
              setStatusData(prev => ({ ...prev, status_id: current.status_id }));
            }
          }
        }
      } catch (err) {
        if (isMounted.current && err.name !== 'AbortError') {
          console.error('Ошибка загрузки статусов:', err);
        }
      }
    }, 500),
    [currentStatus]
  );

  const loadCurrentStatus = useCallback(
    debounce(async () => {
      if (!isMounted.current || !book?.book_id) return;
      
      try {
        console.log(`Загрузка текущего статуса книги ${book.book_id}...`);
        const status = await bookService.getBookStatus(book.book_id);
        if (isMounted.current) {
          setCurrentStatus(status);
          if (status) {
            setStatusData(prev => ({ ...prev, status_id: status.status_id }));
          }
        }
      } catch (err) {
        if (isMounted.current && err.name !== 'AbortError') {
          console.error('Ошибка загрузки текущего статуса:', err);
        }
      }
    }, 500),
    [book?.book_id]
  );

  const loadStatusHistory = useCallback(
    debounce(async () => {
      if (!isMounted.current || !book?.book_id) return;
      
      try {
        console.log(`Загрузка истории статусов книги ${book.book_id}...`);
        const history = await bookService.getBookStatusHistory(book.book_id);
        if (isMounted.current) {
          setStatusHistory(history);
        }
      } catch (err) {
        if (isMounted.current && err.name !== 'AbortError') {
          console.error('Ошибка загрузки истории статусов:', err);
        }
      }
    }, 500),
    [book?.book_id]
  );

  // Загружаем данные только при монтировании и при изменении книги
  useEffect(() => {
    isMounted.current = true;
    
    if (book) {
      console.log('Инициализация загрузки данных для книги:', book.book_id);
      
      // Создаем новый AbortController для отмены предыдущих запросов
      if (loadAbortController.current) {
        loadAbortController.current.abort();
      }
      loadAbortController.current = new AbortController();
      
      // Загружаем данные с задержкой между запросами
      const timer = setTimeout(() => {
        loadStatuses();
        setTimeout(() => {
          loadCurrentStatus();
          setTimeout(() => {
            loadStatusHistory();
          }, 100);
        }, 100);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        if (loadAbortController.current) {
          loadAbortController.current.abort();
        }
      };
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [book]); // Только при изменении книги

  const handleUpdateStatus = async () => {
    try {
      setError('');
      
      if (!statusData.status_id) {
        setError('Выберите статус');
        return;
      }

      // Блокируем повторные запросы
      if (loading) return;
      
      setLoading(true);
      
      // Подготовка данных - ТОЛЬКО status_id обязательно, остальное опционально
      const statusUpdateData = {
        status_id: parseInt(statusData.status_id)
      };
      
      // Добавляем опциональные поля только если они заполнены
      if (statusData.pages_read && statusData.pages_read !== '') {
        statusUpdateData.pages_read = parseInt(statusData.pages_read);
      }
      
      if (statusData.start_date) {
        statusUpdateData.start_date = new Date(statusData.start_date).toISOString().split('T')[0];
      }
      
      if (statusData.end_date) {
        statusUpdateData.end_date = new Date(statusData.end_date).toISOString().split('T')[0];
      }
      
      console.log('Отправка статуса:', statusUpdateData);
      
      const response = await bookService.updateBookStatus(book.book_id, statusUpdateData);
      console.log('Успешный ответ:', response);
      
      toast.success('Статус обновлен');
      setOpenStatusDialog(false);
      
      // Сбрасываем форму
      setStatusData({
        status_id: '',
        start_date: null,
        end_date: null,
        pages_read: ''
      });
      
      // Обновляем данные с небольшой задержкой
      setTimeout(async () => {
        if (isMounted.current) {
          await loadCurrentStatus();
          await loadStatusHistory();
          if (onUpdate) onUpdate();
        }
      }, 500);
      
    } catch (err) {
      console.error('Ошибка обновления статуса:', err);
      console.error('Детали ответа сервера:', err.response?.data);
      
      let errorMessage = 'Ошибка обновления статуса';
      
      // Обрабатываем ошибку валидации
      if (err.response?.status === 422) {
        errorMessage = 'Ошибка валидации данных: ';
        if (err.response?.data?.detail) {
          // Если это массив ошибок
          if (Array.isArray(err.response.data.detail)) {
            errorMessage += err.response.data.detail.map(e => e.msg).join(', ');
          } else {
            errorMessage += err.response.data.detail;
          }
        }
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (isMounted.current) {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDownloadBookCard = async () => {
    try {
      const blob = await reportService.downloadBookCard(book.book_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book_card_${book.book_id}.pdf`;
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

  // Обработчик открытия диалога статуса
  const handleOpenStatusDialog = () => {
    // Загружаем свежие данные перед открытием диалога
    if (book) {
      loadStatuses();
      loadCurrentStatus();
    }
    setOpenStatusDialog(true);
  };

  // Обработчик открытия диалога истории
  const handleOpenHistoryDialog = () => {
    // Загружаем свежую историю перед открытием
    if (book) {
      loadStatusHistory();
    }
    setOpenHistoryDialog(true);
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {book.title}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Авторы: {book.authors.map(a => `${a.last_name} ${a.first_name}`).join(', ')}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Год издания: {book.published}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Издательство: {book.publisher?.name}
          </Typography>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            {book.genres.map((genre) => (
              <Chip
                key={genre.genre_id}
                label={genre.name}
                size="small"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
          
          {currentStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                label={currentStatus.name}
                color={getStatusColor(currentStatus)}
                icon={<BookmarkIcon />}
              />
              <Tooltip title="История статусов">
                <IconButton
                  size="small"
                  onClick={handleOpenHistoryDialog}
                >
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {book.description && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {book.description.length > 150
                ? `${book.description.substring(0, 150)}...`
                : book.description}
            </Typography>
          )}
        </CardContent>
        
        <CardActions>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onEdit && onEdit(book)}
          >
            Редактировать
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={handleOpenStatusDialog}
          >
            Статус
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadBookCard}
          >
            PDF
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() => onDelete && onDelete(book)}
            sx={{ marginLeft: 'auto' }}
          >
            Удалить
          </Button>
        </CardActions>
      </Card>
      
      {/* Диалог изменения статуса */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
        <DialogTitle>Изменение статуса книги</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} locale={ru}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, minWidth: 300 }}>
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
                label="Дата начала (опционально)"
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
                label="Дата окончания (опционально)"
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
                label="Прочитано страниц (опционально)"
                type="number"
                value={statusData.pages_read}
                onChange={(e) => setStatusData({...statusData, pages_read: e.target.value})}
                inputProps={{ min: 0 }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Отмена</Button>
          <Button onClick={handleUpdateStatus} variant="contained" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог истории статусов */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>История статусов книги</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {statusHistory.length === 0 ? (
              <Typography color="textSecondary">История статусов отсутствует</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {statusHistory.map((historyItem, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: index === 0 ? 'action.hover' : 'background.paper'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {statuses.find(s => s.status_id === historyItem.status_id)?.name || 'Неизвестный статус'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(historyItem.created_date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {historyItem.start_date && (
                        <Typography variant="body2">
                          Начало: {formatDate(historyItem.start_date)}
                        </Typography>
                      )}
                      {historyItem.end_date && (
                        <Typography variant="body2">
                          Окончание: {formatDate(historyItem.end_date)}
                        </Typography>
                      )}
                      {historyItem.pages_read && (
                        <Typography variant="body2">
                          Страниц: {historyItem.pages_read}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookCard;