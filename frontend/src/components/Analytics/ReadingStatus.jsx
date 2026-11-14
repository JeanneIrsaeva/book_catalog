import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  MenuBook as MenuBookIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { analyticsService } from '../../services/analytics';
import { bookService } from '../../services/books';
import { useAuth } from '../../context/AuthContext';

const ReadingStatus = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    planned: 0,
    reading: 0,
    completed: 0,
    totalPages: 0,
    avgReadingTime: 0,
    totalBooks: 0,
  });

  const [userBooks, setUserBooks] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Загружаем статусы
      const statusesData = await bookService.getStatuses();
      setStatuses(statusesData);

      // Загружаем книги пользователя
      const booksData = await bookService.getUserBooks(0, 100, '');
      setUserBooks(booksData);

      // Считаем статистику
      const statsData = await calculateStats(booksData, statusesData);
      setStats(statsData);

      // Подготавливаем данные для таблицы
      const statusCounts = {};
      statusesData.forEach(status => {
        statusCounts[status.name] = 0;
      });

      // Считаем книги по статусам
      const analyticsData = [];
      for (const book of booksData) {
        try {
          const status = await bookService.getBookStatus(book.book_id);
          if (status && status.name in statusCounts) {
            statusCounts[status.name]++;
          }
        } catch (err) {
          console.warn(`Не удалось получить статус для книги ${book.book_id}`);
        }
      }

      // Преобразуем в массив для таблицы
      for (const status of statusesData) {
        if (status.name !== 'Не указан') { // Пропускаем если есть такой статус
          analyticsData.push({
            status: status.name,
            count: statusCounts[status.name] || 0
          });
        }
      }

      setAnalytics(analyticsData);

    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Ошибка загрузки аналитики');
      toast.error('Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (books, statuses) => {
    try {
      let planned = 0;
      let reading = 0;
      let completed = 0;
      let totalPages = 0;
      let totalReadingDays = 0;
      let booksWithReadingTime = 0;

      // Инициализируем маппинг статусов для быстрого поиска
      const statusMap = {};
      statuses.forEach(status => {
        statusMap[status.status_id] = status.name;
      });

      // Получаем всю аналитику пользователя
      let userAnalytics = [];
      try {
        userAnalytics = await bookService.getUserAnalytics(user.user_id);
      } catch (err) {
        console.warn('Аналитика временно недоступна, собираем данные из статусов книг');
      }

      // Если есть аналитика, используем ее
      if (userAnalytics && userAnalytics.length > 0) {
        // Собираем уникальные книги по последней аналитике
        const latestAnalytics = {};
        userAnalytics.forEach(analytic => {
          if (!latestAnalytics[analytic.book_id] || 
              new Date(analytic.created_date) > new Date(latestAnalytics[analytic.book_id].created_date)) {
            latestAnalytics[analytic.book_id] = analytic;
          }
        });

        // Обрабатываем аналитику
        Object.values(latestAnalytics).forEach(analytic => {
          const statusName = statusMap[analytic.status_id];
          
          if (statusName === 'В планах') planned++;
          else if (statusName === 'Читаю') reading++;
          else if (statusName === 'Прочитано') completed++;

          // Считаем страницы
          if (analytic.pages_read) {
            totalPages += analytic.pages_read;
          }

          // Рассчитываем время чтения (разница между датами)
          if (analytic.start_date && analytic.end_date) {
            const start = new Date(analytic.start_date);
            const end = new Date(analytic.end_date);
            const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
            totalReadingDays += days;
            booksWithReadingTime++;
          }
        });
      } else {
        // Если аналитики нет, собираем данные из статусов книг
        for (const book of books) {
          try {
            const status = await bookService.getBookStatus(book.book_id);
            if (status) {
              if (status.name === 'В планах') planned++;
              else if (status.name === 'Читаю') reading++;
              else if (status.name === 'Прочитано') completed++;

              // Для страниц нужно получить историю статусов
              const history = await bookService.getBookStatusHistory(book.book_id);
              const completedEntry = history.find(h => {
                const statusName = statuses.find(s => s.status_id === h.status_id)?.name;
                return statusName === 'Прочитано' && h.pages_read;
              });
              
              if (completedEntry?.pages_read) {
                totalPages += completedEntry.pages_read;
              }
            }
          } catch (err) {
            console.warn(`Не удалось получить данные для книги ${book.book_id}`);
          }
        }
      }

      // Рассчитываем среднее время чтения
      let avgReadingTime = 0;
      if (booksWithReadingTime > 0) {
        avgReadingTime = Math.round(totalReadingDays / booksWithReadingTime);
      } else if (completed > 0) {
        // Примерное время для завершенных книг (7-30 дней в зависимости от объема)
        avgReadingTime = Math.max(7, Math.min(30, Math.round(totalPages / 100)));
      }

      return {
        planned,
        reading,
        completed,
        totalPages,
        avgReadingTime,
        totalBooks: planned + reading + completed,
      };

    } catch (err) {
      console.error('Ошибка расчета статистики:', err);
      return {
        planned: 0,
        reading: 0,
        completed: 0,
        totalPages: 0,
        avgReadingTime: 0,
        totalBooks: 0,
      };
    }
  };

  const getProgressPercentage = () => {
    const total = stats.planned + stats.reading + stats.completed;
    if (total === 0) return 0;
    return Math.round((stats.completed / total) * 100);
  };

  const handleRefresh = () => {
    loadData();
    toast.info('Данные аналитики обновлены');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Аналитика чтения
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          variant="outlined"
          disabled={loading}
        >
          Обновить
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Карточка с общим прогрессом */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Общий прогресс чтения
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage()}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #4361ee, #3a0ca3)',
                    }
                  }}
                />
              </Box>
              <Typography variant="h5" fontWeight={600}>
                {getProgressPercentage()}%
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Прочитано {stats.completed} из {stats.totalBooks} книг
            </Typography>
          </Paper>
        </Grid>

        {/* Статистика по статусам */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookmarkIcon color="warning" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">В планах</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {stats.planned}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                книг запланировано
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTimeIcon color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">Читаю</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="info.main">
                {stats.reading}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                книг в процессе
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">Прочитано</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                книг завершено
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Дополнительная статистика */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MenuBookIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6">Объем чтения</Typography>
            </Box>
            <Typography variant="h3" fontWeight={700} color="primary.main">
              {stats.totalPages.toLocaleString('ru-RU')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              всего прочитано страниц
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                {stats.completed > 0 
                  ? `Средний объем: ${Math.round(stats.totalPages / stats.completed).toLocaleString('ru-RU')} стр. на книгу`
                  : 'Добавьте прочитанные книги для расчета'
                }
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ScheduleIcon color="secondary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6">Среднее время</Typography>
            </Box>
            <Typography variant="h3" fontWeight={700} color="secondary.main">
              {stats.avgReadingTime}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              дней на прочтение книги
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                {stats.completed > 0
                  ? `На основе ${stats.completed} завершенных книг`
                  : 'Укажите даты начала и окончания чтения в статусах книг'
                }
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Детализация по статусам */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Детализация по статусам
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Количество книг</TableCell>
                    <TableCell align="right">Процент</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.map((item) => {
                    const total = stats.totalBooks;
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    
                    return (
                      <TableRow 
                        key={item.status}
                        sx={{ 
                          '&:hover': { backgroundColor: 'action.hover' },
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.status === 'В планах' && <BookmarkIcon color="warning" fontSize="small" />}
                            {item.status === 'Читаю' && <AccessTimeIcon color="info" fontSize="small" />}
                            {item.status === 'Прочитано' && <CheckCircleIcon color="success" fontSize="small" />}
                            {item.status}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={500}>
                            {item.count}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ 
                            display: 'inline-block', 
                            bgcolor: 'primary.light', 
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 500
                          }}>
                            {percentage}%
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {stats.totalBooks > 0 && (
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell><strong>Всего</strong></TableCell>
                      <TableCell align="right"><strong>{stats.totalBooks}</strong></TableCell>
                      <TableCell align="right"><strong>100%</strong></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReadingStatus;