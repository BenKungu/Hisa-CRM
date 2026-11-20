import apiClient from './api';

export interface AgentInput {
  agent_code?: string;
  agent_name: string;
  phone_no?: string;
  email?: string;
}

export const agentService = {
  // Register a new agent
  createAgent: async (data: AgentInput): Promise<any> => {
    try {
      const response = await apiClient.post('/agents', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to add agent' };
    }
  },

  // Update a registered agent (code cannot change)
  updateAgent: async (id: string, data: Partial<AgentInput> & { is_active?: boolean }): Promise<any> => {
    try {
      const response = await apiClient.put(`/agents/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to update agent' };
    }
  },
};
