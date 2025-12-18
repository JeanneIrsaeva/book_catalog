import api from './api';

export const statusService = {
  getAllStatuses: async (skip = 0, limit = 100) => {
    const response = await api.get('/statuses', { params: { skip, limit } });
    return response.data;
  },

  getStatusById: async (id) => {
    const response = await api.get(`/statuses/${id}`);
    return response.data;
  },

  createStatus: async (statusData) => {
    const response = await api.post('/statuses', statusData);
    return response.data;
  },

  updateStatus: async (id, statusData) => {
    const response = await api.put(`/statuses/${id}`, statusData);
    return response.data;
  },

  deleteStatus: async (id) => {
    const response = await api.delete(`/statuses/${id}`);
    return response.data;
  },
};