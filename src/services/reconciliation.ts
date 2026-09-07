import apiClient from './api';

export const reconciliationService = {
  uploadOutlook: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiClient.post('/reconciliation/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Upload failed' };
    }
  },
};