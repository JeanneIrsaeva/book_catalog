import api from './api';

export const bookService = {
  getAllBooks: async (skip = 0, limit = 100, search = '') => {
    const params = { skip, limit };
    if (search) params.search = search;
    const response = await api.get('/books', { params });
    return response.data;
  },

  // Получение книг текущего пользователя
  getUserBooks: async (skip = 0, limit = 100, search = '') => {
    const params = { skip, limit };
    if (search) params.search = search;
    const response = await api.get('/books', { params });
    return response.data;
  },

  getBookById: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  // Получение статуса книги для пользователя
  getBookStatus: async (bookId) => {
    const response = await api.get(`/books/${bookId}/status`);
    return response.data;
  },

  // Получение истории статусов
  getBookStatusHistory: async (bookId) => {
    const response = await api.get(`/books/${bookId}/statuses`);
    return response.data;
  },

  createBook: async (bookData) => {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  updateBook: async (id, bookData) => {
    const response = await api.put(`/books/${id}`, bookData);
    return response.data;
  },

  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  getStatuses: async () => {
    const response = await api.get('/statuses/');
    return response.data;
  },

  updateBookStatus: async (bookId, statusData) => {
    console.log('Отправка статуса для книги', bookId, 'данные:', statusData);
    
    // Удаляем book_id если он случайно попал
    const dataToSend = { ...statusData };
    delete dataToSend.book_id;
    
    console.log('Отправляемые данные:', dataToSend);
    
    try {
      const response = await api.post(`/books/${bookId}/status/`, dataToSend);
      console.log('Ответ сервера:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при отправке статуса:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Метод для получения аналитики пользователя
  getUserAnalytics: async (userId) => {
    try {
      const response = await api.get(`/analytics/user/${userId}`);
      return response.data;
    } catch (error) {
      console.warn('Аналитика временно недоступна');
      return [];
    }
  },
};