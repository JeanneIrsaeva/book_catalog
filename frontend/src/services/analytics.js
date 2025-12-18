import api from './api';

export const analyticsService = {
  // Получение статистики пользователя
  getUserStats: async (userId) => {
    try {
      const response = await api.get(`/analytics/user/${userId}/stats`);
      return response.data;
    } catch (error) {
      // Возвращаем заглушку если эндпоинт не реализован
      return {
        planned: 0,
        reading: 0,
        completed: 0,
        totalPages: 0,
        avgReadingTime: 0,
      };
    }
  },

  // Получение книг по статусу
  getBooksByStatus: async (userId, statusId) => {
    try {
      const response = await api.get(`/analytics/user/${userId}/status/${statusId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  // Получение прогресса чтения
  getReadingProgress: async (userId) => {
    try {
      const response = await api.get(`/analytics/user/${userId}/progress`);
      return response.data;
    } catch (error) {
      return { percentage: 0, total: 0, completed: 0 };
    }
  },
};