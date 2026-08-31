import apiClient from './api';

export const policyService = {
  // Get all policies
  getPolicies: async (params?: any): Promise<any> => {
    try {
      const response = await apiClient.get('/policies', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to get policies' };
    }
  },

  // Get single policy
  getPolicy: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/policies/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to get policy' };
    }
  },

  // Create policy
  createPolicy: async (data: any): Promise<any> => {
    try {
      const response = await apiClient.post('/policies', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to create policy' };
    }
  },

  // Update policy
  updatePolicy: async (id: string, data: any): Promise<any> => {
    try {
      const response = await apiClient.put(`/policies/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to update policy' };
    }
  },

  // Delete policy
  deletePolicy: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`/policies/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to delete policy' };
    }
  },

  // Get all agents with stats
getAgents: async (): Promise<any> => {
  try {
    const response = await apiClient.get('/policies/agents');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to get agents' };
  }
},

importExcel: async (formData: FormData): Promise<any> => {
  try {
    const response = await apiClient.post('/policies/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to import Excel' };
  }
},

// Get policy change history
getPolicyHistory: async (id: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/policies/${id}/history`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to get policy history' };
  }
},

};