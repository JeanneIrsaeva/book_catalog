import React, { useState } from 'react'; // Добавляем импорт useState
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
import { authorService } from '../../services/authors';

const validationSchema = yup.object({
  last_name: yup.string().required('Введите фамилию'),
  first_name: yup.string().required('Введите имя'),
  middle_name: yup.string(),
});

const AuthorForm = ({ author, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      last_name: author?.last_name || '',
      first_name: author?.first_name || '',
      middle_name: author?.middle_name || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        if (author) {
          await authorService.updateAuthor(author.author_id, values);
          toast.success('Автор обновлен');
        } else {
          await authorService.createAuthor(values);
          toast.success('Автор добавлен');
        }
        onSave();
      } catch (err) {
        setError(err.response?.data?.detail || 'Ошибка сохранения');
        toast.error('Ошибка сохранения автора');
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
          id="last_name"
          name="last_name"
          label="Фамилия"
          value={formik.values.last_name}
          onChange={formik.handleChange}
          error={formik.touched.last_name && Boolean(formik.errors.last_name)}
          helperText={formik.touched.last_name && formik.errors.last_name}
        />

        <TextField
          fullWidth
          id="first_name"
          name="first_name"
          label="Имя"
          value={formik.values.first_name}
          onChange={formik.handleChange}
          error={formik.touched.first_name && Boolean(formik.errors.first_name)}
          helperText={formik.touched.first_name && formik.errors.first_name}
        />

        <TextField
          fullWidth
          id="middle_name"
          name="middle_name"
          label="Отчество"
          value={formik.values.middle_name}
          onChange={formik.handleChange}
          error={formik.touched.middle_name && Boolean(formik.errors.middle_name)}
          helperText={formik.touched.middle_name && formik.errors.middle_name}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={onCancel} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : author ? 'Обновить' : 'Добавить'}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default AuthorForm;