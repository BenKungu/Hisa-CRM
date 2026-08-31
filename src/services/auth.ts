import apiClient from './api';

export const authService = {
  // Send OTP
  sendOTP: async (email: string, password: string): Promise<any> => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      // Only handle network errors, not invalid credentials
      if (error.response?.status === 400) {
        throw error.response.data; // Throw validation errors
      }
      // If OTP generation fails for other reasons, still show error
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

// Update user profile
updateProfile: async (data: any): Promise<any> => {
  try {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to update profile' };
  }
},

// Change password
changePassword: async (oldPassword: string, newPassword: string): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to change password' };
  }
},

// Forgot Password
forgotPassword: async (email: string): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/forgotpassword', { email });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to send reset link' };
  }
},

// Reset Password
resetPassword: async (email: string, token: string, newPassword: string): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/reset-password', { email, token, newPassword });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to reset password' };
  }
},

// Unlock screen (password only, no OTP)
unlockScreen: async (password: string): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/unlock', { password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Invalid password' };
  }
},

};