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
import { authorService } from '../../services/authors';
import AuthorForm from './AuthorForm';

const AuthorList = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState(null);

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    try {
      setLoading(true);
      const data = await authorService.getAllAuthors();
      setAuthors(data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки авторов');
      toast.error('Ошибка загрузки авторов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAuthor = () => {
    setSelectedAuthor(null);
    setOpenDialog(true);
  };

  const handleEditAuthor = (author) => {
    setSelectedAuthor(author);
    setOpenDialog(true);
  };

  const handleDeleteAuthor = async () => {
    try {
      await authorService.deleteAuthor(authorToDelete.author_id);
      toast.success('Автор удален');
      loadAuthors();
      setDeleteDialogOpen(false);
      setAuthorToDelete(null);
    } catch (err) {
      toast.error('Ошибка удаления автора');
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedAuthor(null);
  };

  const handleSaveAuthor = () => {
    loadAuthors();
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
        <Typography variant="h4">Авторы</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAuthor}
        >
          Добавить автора
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
              <TableCell>Фамилия</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Отчество</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {authors.map((author) => (
              <TableRow key={author.author_id}>
                <TableCell>{author.last_name}</TableCell>
                <TableCell>{author.first_name}</TableCell>
                <TableCell>{author.middle_name || '-'}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditAuthor(author)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => {
                      setAuthorToDelete(author);
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
          {selectedAuthor ? 'Редактировать автора' : 'Добавить автора'}
        </DialogTitle>
        <DialogContent>
          <AuthorForm
            author={selectedAuthor}
            onSave={handleSaveAuthor}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          Вы уверены, что хотите удалить автора "{authorToDelete?.last_name} {authorToDelete?.first_name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteAuthor} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AuthorList;