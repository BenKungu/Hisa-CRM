import apiClient from './api';

export const authService = {
  // Send OTP (returns success, redirects to OTP page)
  sendOTP: async (email: string): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/login', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to send OTP' };
    }
  },

  // Verify OTP
  verifyOTP: async (email: string, otp: string, password: string): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/verify-otp', { email, otp, password });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Invalid OTP or password' };
    }
  },

  // Register
  register: async (email: string, password: string, firstName: string, lastName: string): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/register', { email, password, firstName, lastName });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  // Get profile
  getProfile: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to get profile' };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Check authentication
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};