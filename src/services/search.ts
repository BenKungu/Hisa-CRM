import apiClient from './api';

export const searchService = {
  search: async (query: string): Promise<any> => {
    try {
      const response = await apiClient.get('/search', { params: { q: query } });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Search failed' };
    }
  },
};