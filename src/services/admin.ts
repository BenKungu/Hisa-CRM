import apiClient from './api';

export const adminService = {
  // Add email to whitelist
  addToWhitelist: async (email: string): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/whitelist', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to add to whitelist' };
    }
  },

  // Approve whitelist entry
  approveWhitelist: async (email: string): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/whitelist/approve', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to approve' };
    }
  },

  // Reject whitelist entry
  rejectWhitelist: async (email: string): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/whitelist/reject', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to reject' };
    }
  },

  // Get all whitelist entries
getWhitelist: async (): Promise<any> => {
  try {
    const response = await apiClient.get('/auth/whitelist');
    // Ensure the data has firstName and lastName fields
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to get whitelist' };
  }
},

  // Remove from whitelist
  removeFromWhitelist: async (email: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`/auth/whitelist/${email}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to remove from whitelist' };
    }
  },
};