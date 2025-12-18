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
import { statusService } from '../../services/statuses';

const validationSchema = yup.object({
  name: yup.string()
    .required('Введите название статуса')
    .min(2, 'Название должно быть не менее 2 символов')
    .max(255, 'Название должно быть не более 255 символов'),
});

const StatusForm = ({ status, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      name: status?.name || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        if (status) {
          await statusService.updateStatus(status.status_id, values);
          toast.success('Статус обновлен');
        } else {
          await statusService.createStatus(values);
          toast.success('Статус добавлен');
        }
        onSave();
      } catch (err) {
        setError(err.response?.data?.detail || 'Ошибка сохранения');
        toast.error('Ошибка сохранения статуса');
      } finally {
        setLoading(false);
      }
    },
  });

  const isDefaultStatus = status?.name && ['В планах', 'Читаю', 'Прочитано'].includes(status.name);

  return (
    <form onSubmit={formik.handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {error && (
          <Alert severity="error">{error}</Alert>
        )}
        
        {isDefaultStatus && (
          <Alert severity="info">
            Вы редактируете системный статус. Изменение названия может повлиять на логику приложения.
          </Alert>
        )}
        
        <TextField
          fullWidth
          id="name"
          name="name"
          label="Название статуса"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
          disabled={isDefaultStatus} // Запрещаем редактирование системных статусов
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={onCancel} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : status ? 'Обновить' : 'Добавить'}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default StatusForm;