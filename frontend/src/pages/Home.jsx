import React from 'react';
import { Typography, Box, Paper, Grid } from '@mui/material';
import {
  Book as BookIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Добро пожаловать, {user?.name}!
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Система для учета и каталогизации вашей книжной коллекции
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <BookIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">Книги</Typography>
            <Typography variant="body2" color="textSecondary">
              Управление книжной коллекцией
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h6">Авторы</Typography>
            <Typography variant="body2" color="textSecondary">
              Справочник авторов
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CategoryIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h6">Жанры</Typography>
            <Typography variant="body2" color="textSecondary">
              Классификация по жанрам
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <BusinessIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6">Издательства</Typography>
            <Typography variant="body2" color="textSecondary">
              Список издательств
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Возможности системы:
        </Typography>
        <ul>
          <li>Добавление и редактирование книг</li>
          <li>Управление статусами чтения (В планах, Читаю, Прочитано)</li>
          <li>Ведение справочников авторов, жанров и издательств</li>
          <li>Генерация отчетов в формате PDF</li>
          <li>Поиск по книгам</li>
          {user?.is_admin && <li>Управление пользователями (админ)</li>}
        </ul>
      </Paper>
    </Box>
  );
};

export default Home;