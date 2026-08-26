import apiClient from './api';

export const clientService = {
  // Create client
  createClient: async (data: any): Promise<any> => {
    try {
      const response = await apiClient.post('/clients', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to create client' };
    }
  },

  // Get all clients
  getClients: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/clients');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to get clients' };
    }
  },
};