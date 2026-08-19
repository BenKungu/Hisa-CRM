// API constants derived from Vite env with sensible fallbacks
// Configure in .env as:
// VITE_API_BASE_URL=https://api.example.com
// VITE_API_TIMEOUT=15000

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
export const API_TIMEOUT_MS = Number((import.meta as any).env?.VITE_API_TIMEOUT || 15000);

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  users: {
    root: '/users',
  },
} as const;
