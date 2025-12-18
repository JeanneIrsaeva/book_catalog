import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { bookService } from '../../services/books';
import { useAuth } from '../../context/AuthContext';
import BookForm from './BookForm';
import BookCard from './BookCard';

const BookList = () => {
  const { user } = useAuth(); // user используется для будущих расширений
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    // Фильтрация книг по поиску
    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.authors.some(author => 
        `${author.last_name} ${author.first_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredBooks(filtered);
  }, [books, searchTerm]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      // Используем метод для получения книг пользователя
      const data = await bookService.getUserBooks(0, 100, '');
      setBooks(data);
      setFilteredBooks(data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки книг');
      toast.error('Ошибка загрузки книг');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddBook = () => {
    setSelectedBook(null);
    setOpenDialog(true);
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setOpenDialog(true);
  };
  
  const handleDeleteBook = async () => {
    try {
      await bookService.deleteBook(bookToDelete.book_id);
      toast.success('Книга удалена из вашей коллекции');
      loadBooks();
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    } catch (err) {
      toast.error('Ошибка удаления книги');
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedBook(null);
  };

  const handleSaveBook = () => {
    loadBooks();
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
        <Typography variant="h4">Мои книги</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddBook}
        >
          Добавить книгу
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Поиск по названию или автору"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearch}
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {filteredBooks.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            У вас пока нет книг в коллекции
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddBook}
            sx={{ mt: 2 }}
          >
            Добавить первую книгу
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredBooks.map((book) => (
            <Grid item xs={12} sm={6} md={4} key={book.book_id}>
              <BookCard
                book={book}
                onUpdate={loadBooks}
                onEdit={() => handleEditBook(book)}
                onDelete={() => {
                  setBookToDelete(book);
                  setDeleteDialogOpen(true);
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedBook ? 'Редактировать книгу' : 'Добавить книгу'}
        </DialogTitle>
        <DialogContent>
          <BookForm
            book={selectedBook}
            onSave={handleSaveBook}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          Вы уверены, что хотите удалить книгу "{bookToDelete?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteBook} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BookList;