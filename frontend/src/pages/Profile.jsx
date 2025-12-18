import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const validationSchema = yup.object({
  name: yup.string().required('Введите имя'),
  login: yup.string().required('Введите логин'),
  password: yup.string().min(6, 'Пароль должен быть не менее 6 символов'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Пароли должны совпадать'),
});

const Profile = () => {
  const { user, loadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      name: user?.name || '',
      login: user?.login || '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        // Здесь должен быть вызов API для обновления пользователя
        // await userService.updateUser(user.user_id, values);
        await loadUser();
        toast.success('Профиль обновлен');
        formik.setFieldValue('password', '');
        formik.setFieldValue('confirmPassword', '');
      } catch (err) {
        setError('Ошибка обновления профиля');
        toast.error('Ошибка обновления профиля');
      } finally {
        setLoading(false);
      }
    },
  });

  if (!user) {
    return null;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Профиль пользователя
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Chip
          label={user.is_admin ? 'Администратор' : 'Пользователь'}
          color={user.is_admin ? 'primary' : 'default'}
          sx={{ mr: 1 }}
        />
        <Chip
          label={`ID: ${user.user_id}`}
          variant="outlined"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Имя"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="login"
              name="login"
              label="Логин"
              value={formik.values.login}
              onChange={formik.handleChange}
              error={formik.touched.login && Boolean(formik.errors.login)}
              helperText={formik.touched.login && formik.errors.login}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Новый пароль"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Подтверждение пароля"
              type="password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Сохранить изменения'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default Profile;