import apiClient from './api';

export const mmfService = {
  getMmfAccounts: async (params?: any): Promise<any> => {
    try {
      const response = await apiClient.get('/mmf', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to get MMF accounts' };
    }
  },

  exportMmf: async (params?: any): Promise<Blob> => {
    try {
      const response = await apiClient.get('/mmf/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to export MMF' };
    }
  },

  getMmfStats: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/mmf/stats');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to get MMF stats' };
    }
  },

};