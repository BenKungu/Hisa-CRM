import apiClient from './api';

export const dashboardService = {
  getPerformance: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/dashboard/performance');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to get performance' };
    }
  },
};