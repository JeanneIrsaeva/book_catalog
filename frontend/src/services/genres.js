import api from './api';

export const genreService = {
  getAllGenres: async (skip = 0, limit = 100) => {
    const response = await api.get('/genres', { params: { skip, limit } });
    return response.data;
  },

  getGenreById: async (id) => {
    const response = await api.get(`/genres/${id}`);
    return response.data;
  },

  createGenre: async (genreData) => {
    const response = await api.post('/genres', genreData);
    return response.data;
  },

  updateGenre: async (id, genreData) => {
    const response = await api.put(`/genres/${id}`, genreData);
    return response.data;
  },

  deleteGenre: async (id) => {
    const response = await api.delete(`/genres/${id}`);
    return response.data;
  },
};