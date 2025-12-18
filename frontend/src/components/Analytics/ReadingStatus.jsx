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
      
      const analyticsData = statusesData.map(status => ({
        status: status.name,
        count: statusCounts[status.name] || 0
      }));
      
      setAnalytics(analyticsData);
      setError('');
      
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Ошибка загрузки аналитики');
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
      
      // Инициализируем маппинг статусов для быстрого поиска
      const statusMap = {};
      statuses.forEach(status => {
        statusMap[status.status_id] = status.name;
      });
      
      // Получаем аналитику пользователя
      const userAnalytics = await bookService.getUserAnalytics(user.user_id);
      
      // Считаем статистику из аналитики
      if (userAnalytics && userAnalytics.length > 0) {
        // Считаем книги по статусам из последней аналитики
        const latestAnalytics = {};
        userAnalytics.forEach(analytic => {
          if (!latestAnalytics[analytic.book_id] || 
              new Date(analytic.created_date) > new Date(latestAnalytics[analytic.book_id].created_date)) {
            latestAnalytics[analytic.book_id] = analytic;
          }
        });
        
        Object.values(latestAnalytics).forEach(analytic => {
          const statusName = statusMap[analytic.status_id];
          if (statusName === 'В планах') planned++;
          else if (statusName === 'Читаю') reading++;
          else if (statusName === 'Прочитано') completed++;
          
          if (analytic.pages_read) {
            totalPages += analytic.pages_read;
          }
        });
      }
      
      // Если аналитики нет, пытаемся получить статусы для каждой книги
      if (planned === 0 && reading === 0 && completed === 0) {
        for (const book of books) {
          try {
            const status = await bookService.getBookStatus(book.book_id);
            if (status) {
              if (status.name === 'В планах') planned++;
              else if (status.name === 'Читаю') reading++;
              else if (status.name === 'Прочитано') completed++;
            }
          } catch (err) {
            console.warn(`Не удалось получить статус для книги ${book.book_id}`);
          }
        }
      }
      
      // Рассчитываем среднее время чтения (упрощенно)
      const avgReadingTime = completed > 0 ? Math.round((planned + reading + completed) / 3) : 0;
      
      return {
        planned,
        reading,
        completed,
        totalPages,
        avgReadingTime,
      };
    } catch (err) {
      console.error('Ошибка расчета статистики:', err);
      return {
        planned: 0,
        reading: 0,
        completed: 0,
        totalPages: 0,
        avgReadingTime: 0,
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
    toast.info('Данные обновлены');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
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
              Общий прогресс
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage()}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body1">
                {getProgressPercentage()}%
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Прочитано {stats.completed} из {stats.planned + stats.reading + stats.completed} книг
            </Typography>
          </Paper>
        </Grid>
        
        {/* Статистика по статусам */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookmarkIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">В планах</Typography>
              </Box>
              <Typography variant="h3">{stats.planned}</Typography>
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
                <AccessTimeIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Читаю</Typography>
              </Box>
              <Typography variant="h3">{stats.reading}</Typography>
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
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Прочитано</Typography>
              </Box>
              <Typography variant="h3">{stats.completed}</Typography>
              <Typography variant="body2" color="textSecondary">
                книг завершено
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Дополнительная статистика */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Объем чтения</Typography>
            </Box>
            <Typography variant="h4">{stats.totalPages.toLocaleString()}</Typography>
            <Typography variant="body2" color="textSecondary">
              всего прочитано страниц
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccessTimeIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Среднее время</Typography>
            </Box>
            <Typography variant="h4">{stats.avgReadingTime} дн.</Typography>
            <Typography variant="body2" color="textSecondary">
              среднее время чтения книги
            </Typography>
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
                    const total = stats.planned + stats.reading + stats.completed;
                    return (
                      <TableRow key={item.status}>
                        <TableCell>{item.status}</TableCell>
                        <TableCell align="right">{item.count}</TableCell>
                        <TableCell align="right">
                          {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell><strong>Всего</strong></TableCell>
                    <TableCell align="right"><strong>{stats.planned + stats.reading + stats.completed}</strong></TableCell>
                    <TableCell align="right"><strong>100%</strong></TableCell>
                  </TableRow>
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