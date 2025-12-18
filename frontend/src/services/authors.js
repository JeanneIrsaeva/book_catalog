import api from './api';

export const authorService = {
  getAllAuthors: async (skip = 0, limit = 100) => {
    const response = await api.get('/authors', { params: { skip, limit } });
    return response.data;
  },

  getAuthorById: async (id) => {
    const response = await api.get(`/authors/${id}`);
    return response.data;
  },

  createAuthor: async (authorData) => {
    const response = await api.post('/authors', authorData);
    return response.data;
  },

  updateAuthor: async (id, authorData) => {
    const response = await api.put(`/authors/${id}`, authorData);
    return response.data;
  },

  deleteAuthor: async (id) => {
    const response = await api.delete(`/authors/${id}`);
    return response.data;
  },
};