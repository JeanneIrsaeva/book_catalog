import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { genreService } from '../../services/genres';
import GenreForm from './GenreForm';

const GenreList = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState(null);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const data = await genreService.getAllGenres();
      setGenres(data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки жанров');
      toast.error('Ошибка загрузки жанров');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = () => {
    setSelectedGenre(null);
    setOpenDialog(true);
  };

  const handleEditGenre = (genre) => {
    setSelectedGenre(genre);
    setOpenDialog(true);
  };

  const handleDeleteGenre = async () => {
    try {
      await genreService.deleteGenre(genreToDelete.genre_id);
      toast.success('Жанр удален');
      loadGenres();
      setDeleteDialogOpen(false);
      setGenreToDelete(null);
    } catch (err) {
      toast.error('Ошибка удаления жанра');
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedGenre(null);
  };

  const handleSaveGenre = () => {
    loadGenres();
    handleDialogClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Жанры</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddGenre}
        >
          Добавить жанр
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Название жанра</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {genres.map((genre) => (
              <TableRow key={genre.genre_id}>
                <TableCell>{genre.genre_id}</TableCell>
                <TableCell>{genre.name}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditGenre(genre)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => {
                      setGenreToDelete(genre);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedGenre ? 'Редактировать жанр' : 'Добавить жанр'}
        </DialogTitle>
        <DialogContent>
          <GenreForm
            genre={selectedGenre}
            onSave={handleSaveGenre}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          Вы уверены, что хотите удалить жанр "{genreToDelete?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteGenre} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default GenreList;