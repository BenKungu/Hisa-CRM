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

  exportClients: async (filters: any): Promise<Blob> => {
    try {
      const response = await apiClient.get('/clients/export', {
        params: filters,
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to export clients' };
    }
  },

// Delete client
  deleteClient: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`/clients/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to delete client' };
    }
  },

};