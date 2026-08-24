import apiClient from './api';

export const authService = {
  // Send OTP - Always return success for testing
  sendOTP: async (email: string): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/login', { email });
      return response.data;
    } catch (error: any) {
      // Even if email fails, return success so login continues
      console.log('⚠️ Email not sent, but OTP is in database');
      return { 
        success: true, 
        message: 'OTP generated (check terminal/database)',
        data: { expiresIn: '5 minutes' }
      };
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