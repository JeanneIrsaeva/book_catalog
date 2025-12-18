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
import { publisherService } from '../../services/publishers';

const validationSchema = yup.object({
  name: yup.string().required('Введите название издательства'),
});

const PublisherForm = ({ publisher, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      name: publisher?.name || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        if (publisher) {
          await publisherService.updatePublisher(publisher.publisher_id, values);
          toast.success('Издательство обновлено');
        } else {
          await publisherService.createPublisher(values);
          toast.success('Издательство добавлено');
        }
        onSave();
      } catch (err) {
        setError(err.response?.data?.detail || 'Ошибка сохранения');
        toast.error('Ошибка сохранения издательства');
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
          label="Название издательства"
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
            {loading ? <CircularProgress size={24} /> : publisher ? 'Обновить' : 'Добавить'}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default PublisherForm;