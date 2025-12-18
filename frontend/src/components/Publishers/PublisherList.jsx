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
import { publisherService } from '../../services/publishers';
import PublisherForm from './PublisherForm';

const PublisherList = () => {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publisherToDelete, setPublisherToDelete] = useState(null);

  useEffect(() => {
    loadPublishers();
  }, []);

  const loadPublishers = async () => {
    try {
      setLoading(true);
      const data = await publisherService.getAllPublishers();
      setPublishers(data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки издательств');
      toast.error('Ошибка загрузки издательств');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPublisher = () => {
    setSelectedPublisher(null);
    setOpenDialog(true);
  };

  const handleEditPublisher = (publisher) => {
    setSelectedPublisher(publisher);
    setOpenDialog(true);
  };

  const handleDeletePublisher = async () => {
    try {
      await publisherService.deletePublisher(publisherToDelete.publisher_id);
      toast.success('Издательство удалено');
      loadPublishers();
      setDeleteDialogOpen(false);
      setPublisherToDelete(null);
    } catch (err) {
      toast.error('Ошибка удаления издательства');
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedPublisher(null);
  };

  const handleSavePublisher = () => {
    loadPublishers();
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
        <Typography variant="h4">Издательства</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPublisher}
        >
          Добавить издательство
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
              <TableCell>Название издательства</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {publishers.map((publisher) => (
              <TableRow key={publisher.publisher_id}>
                <TableCell>{publisher.publisher_id}</TableCell>
                <TableCell>{publisher.name}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditPublisher(publisher)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => {
                      setPublisherToDelete(publisher);
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
          {selectedPublisher ? 'Редактировать издательство' : 'Добавить издательство'}
        </DialogTitle>
        <DialogContent>
          <PublisherForm
            publisher={selectedPublisher}
            onSave={handleSavePublisher}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          Вы уверены, что хотите удалить издательство "{publisherToDelete?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeletePublisher} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PublisherList;