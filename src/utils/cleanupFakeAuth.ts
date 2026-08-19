/**
 * Utility function to clean up fake authentication data from localStorage
 * This should be called once to remove any existing fake auth data
 */
export function cleanupFakeAuthData(): void {
  try {
    // Remove fake auth keys that were used in the previous implementation
    localStorage.removeItem('Dreams Timer_registered_user_v1');
    localStorage.removeItem('Dreams Timer_auth_state_v1');
    
    // Fake authentication data cleaned up from localStorage
  } catch (error) {
    console.warn('Failed to clean up fake auth data:', error);
  }
}

/**
 * Check if fake auth data exists in localStorage
 */
export function hasFakeAuthData(): boolean {
  try {
    return !!(
      localStorage.getItem('Dreams Timer_registered_user_v1') ||
      localStorage.getItem('Dreams Timer_auth_state_v1')
    );
  } catch {
    return false;
  }
}
