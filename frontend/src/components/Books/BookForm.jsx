import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  CircularProgress,
  FormHelperText,
  Alert,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { bookService } from '../../services/books';
import { authorService } from '../../services/authors';
import { genreService } from '../../services/genres';
import { publisherService } from '../../services/publishers';

const validationSchema = yup.object({
  title: yup.string().required('Введите название книги'),
  published: yup
    .number()
    .min(1000, 'Год должен быть не меньше 1000')
    .max(new Date().getFullYear(), 'Год не может быть больше текущего')
    .required('Введите год издания'),
  description: yup.string(),
  publisher_id: yup.number().required('Выберите издательство'),
  author_ids: yup
    .array()
    .min(1, 'Выберите хотя бы одного автора')
    .required('Выберите авторов'),
  genre_ids: yup
    .array()
    .min(1, 'Выберите хотя бы один жанр')
    .required('Выберите жанры'),
});

const BookForm = ({ book, onSave, onCancel }) => {
  const [authors, setAuthors] = useState([]);
  const [genres, setGenres] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [authorsData, genresData, publishersData, statusesData] =
        await Promise.all([
          authorService.getAllAuthors(),
          genreService.getAllGenres(),
          publisherService.getAllPublishers(),
          bookService.getStatuses(),
        ]);
      setAuthors(authorsData);
      setGenres(genresData);
      setPublishers(publishersData);
      setStatuses(statusesData);
    } catch (err) {
      setError('Ошибка загрузки данных');
      toast.error('Ошибка загрузки данных');
    } finally {
      setInitialLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      title: book?.title || '',
      published: book?.published || new Date().getFullYear(),
      description: book?.description || '',
      publisher_id: book?.publisher?.publisher_id || '',
      author_ids: book?.authors?.map((a) => a.author_id) || [],
      genre_ids: book?.genres?.map((g) => g.genre_id) || [],
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        if (book) {
          await bookService.updateBook(book.book_id, values);
          toast.success('Книга обновлена');
        } else {
          await bookService.createBook(values);
          toast.success('Книга добавлена');
        }
        onSave();
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Ошибка сохранения';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} locale={ru}>
      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}
          
          <TextField
            fullWidth
            id="title"
            name="title"
            label="Название книги"
            value={formik.values.title}
            onChange={formik.handleChange}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
          />
          
          <TextField
            fullWidth
            id="published"
            name="published"
            label="Год издания"
            type="number"
            value={formik.values.published}
            onChange={formik.handleChange}
            error={formik.touched.published && Boolean(formik.errors.published)}
            helperText={formik.touched.published && formik.errors.published}
          />
          
          <FormControl fullWidth error={formik.touched.publisher_id && Boolean(formik.errors.publisher_id)}>
            <InputLabel>Издательство</InputLabel>
            <Select
              id="publisher_id"
              name="publisher_id"
              value={formik.values.publisher_id}
              onChange={formik.handleChange}
              label="Издательство"
            >
              {publishers.map((publisher) => (
                <MenuItem key={publisher.publisher_id} value={publisher.publisher_id}>
                  {publisher.name}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.publisher_id && formik.errors.publisher_id && (
              <FormHelperText>{formik.errors.publisher_id}</FormHelperText>
            )}
          </FormControl>
          
          <FormControl fullWidth error={formik.touched.author_ids && Boolean(formik.errors.author_ids)}>
            <InputLabel>Авторы</InputLabel>
            <Select
              multiple
              id="author_ids"
              name="author_ids"
              value={formik.values.author_ids}
              onChange={formik.handleChange}
              input={<OutlinedInput label="Авторы" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const author = authors.find((a) => a.author_id === value);
                    return (
                      <Chip
                        key={value}
                        label={`${author?.last_name} ${author?.first_name}`}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {authors.map((author) => (
                <MenuItem key={author.author_id} value={author.author_id}>
                  {author.last_name} {author.first_name}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.author_ids && formik.errors.author_ids && (
              <FormHelperText>{formik.errors.author_ids}</FormHelperText>
            )}
          </FormControl>
          
          <FormControl fullWidth error={formik.touched.genre_ids && Boolean(formik.errors.genre_ids)}>
            <InputLabel>Жанры</InputLabel>
            <Select
              multiple
              id="genre_ids"
              name="genre_ids"
              value={formik.values.genre_ids}
              onChange={formik.handleChange}
              input={<OutlinedInput label="Жанры" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const genre = genres.find((g) => g.genre_id === value);
                    return <Chip key={value} label={genre?.name} />;
                  })}
                </Box>
              )}
            >
              {genres.map((genre) => (
                <MenuItem key={genre.genre_id} value={genre.genre_id}>
                  {genre.name}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.genre_ids && formik.errors.genre_ids && (
              <FormHelperText>{formik.errors.genre_ids}</FormHelperText>
            )}
          </FormControl>
          
          <TextField
            fullWidth
            id="description"
            name="description"
            label="Описание"
            multiline
            rows={4}
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
          />
          
          {book && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Информация о книге:
              </Typography>
              <Typography variant="body2">
                ID: {book.book_id}
              </Typography>
              <Typography variant="body2">
                Дата добавления: {new Date(book.added_date).toLocaleDateString('ru-RU')}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={onCancel} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : book ? 'Обновить' : 'Добавить'}
            </Button>
          </Box>
        </Box>
      </form>
    </LocalizationProvider>
  );
};

export default BookForm;