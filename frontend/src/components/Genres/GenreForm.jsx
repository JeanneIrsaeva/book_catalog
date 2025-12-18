import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { genreService } from '../../services/genres';

const validationSchema = yup.object({
  name: yup.string().required('Введите название жанра'),
});

const GenreForm = ({ genre, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      name: genre?.name || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        if (genre) {
          await genreService.updateGenre(genre.genre_id, values);
          toast.success('Жанр обновлен');
        } else {
          await genreService.createGenre(values);
          toast.success('Жанр добавлен');
        }
        onSave();
      } catch (err) {
        setError(err.response?.data?.detail || 'Ошибка сохранения');
        toast.error('Ошибка сохранения жанра');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        <TextField
          fullWidth
          id="name"
          name="name"
          label="Название жанра"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={onCancel} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : genre ? 'Обновить' : 'Добавить'}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default GenreForm;