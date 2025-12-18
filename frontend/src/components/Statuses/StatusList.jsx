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
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import StatusForm from './StatusForm';
import { statusService } from '../../services/statuses';

const StatusList = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const data = await statusService.getAllStatuses();
      setStatuses(data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки статусов');
      toast.error('Ошибка загрузки статусов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = () => {
    setSelectedStatus(null);
    setOpenDialog(true);
  };

  const handleEditStatus = (status) => {
    setSelectedStatus(status);
    setOpenDialog(true);
  };

  const handleDeleteStatus = async () => {
    try {
      await statusService.deleteStatus(statusToDelete.status_id);
      toast.success('Статус удален');
      loadStatuses();
      setDeleteDialogOpen(false);
      setStatusToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка удаления статуса');
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedStatus(null);
  };

  const handleSaveStatus = () => {
    loadStatuses();
    handleDialogClose();
  };

  const isDefaultStatus = (statusName) => {
    return ['В планах', 'Читаю', 'Прочитано'].includes(statusName);
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
        <Typography variant="h4">Статусы книг</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddStatus}
        >
          Добавить статус
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
              <TableCell>Название статуса</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.status_id}>
                <TableCell>{status.status_id}</TableCell>
                <TableCell>{status.name}</TableCell>
                <TableCell>
                  {isDefaultStatus(status.name) ? (
                    <Chip label="Системный" color="primary" size="small" />
                  ) : (
                    <Chip label="Пользовательский" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditStatus(status)}
                  >
                    <EditIcon />
                  </IconButton>
                  {!isDefaultStatus(status.name) && (
                    <IconButton
                      color="secondary"
                      onClick={() => {
                        setStatusToDelete(status);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedStatus ? 'Редактировать статус' : 'Добавить статус'}
        </DialogTitle>
        <DialogContent>
          <StatusForm
            status={selectedStatus}
            onSave={handleSaveStatus}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          Вы уверены, что хотите удалить статус "{statusToDelete?.name}"?
          {statusToDelete && !isDefaultStatus(statusToDelete.name) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Это действие нельзя будет отменить
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteStatus} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StatusList;