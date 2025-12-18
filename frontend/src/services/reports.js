import api from './api';

export const reportService = {
  generateReport: async (reportData) => {
    // Конвертируем даты в строки для корректной отправки
    const dataToSend = {
      ...reportData,
      period_from: reportData.period_from ? reportData.period_from.toISOString().split('T')[0] : null,
      period_to: reportData.period_to ? reportData.period_to.toISOString().split('T')[0] : null
    };
    
    console.log('Отправка данных отчета:', dataToSend);
    
    const response = await api.post('/reports/generate', dataToSend, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadBookCard: async (bookId) => {
    const reportData = {
      report_type: 'book_card',
      book_id: bookId,
    };
    return reportService.generateReport(reportData);
  },

  downloadCollectionGrowth: async (periodFrom, periodTo) => {
    const reportData = {
      report_type: 'collection_growth',
      period_from: periodFrom,
      period_to: periodTo,
    };
    return reportService.generateReport(reportData);
  },
};