import api from './api';

export const publisherService = {
  getAllPublishers: async (skip = 0, limit = 100) => {
    const response = await api.get('/publishers', { params: { skip, limit } });
    return response.data;
  },

  getPublisherById: async (id) => {
    const response = await api.get(`/publishers/${id}`);
    return response.data;
  },

  createPublisher: async (publisherData) => {
    const response = await api.post('/publishers', publisherData);
    return response.data;
  },

  updatePublisher: async (id, publisherData) => {
    const response = await api.put(`/publishers/${id}`, publisherData);
    return response.data;
  },

  deletePublisher: async (id) => {
    const response = await api.delete(`/publishers/${id}`);
    return response.data;
  },
};