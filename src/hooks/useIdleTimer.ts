import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const useIdleTimer = () => {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    // Clear existing timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) return;

    // Set new timeout for idle detection
    timerRef.current = setTimeout(() => {
      const currentPath = window.location.pathname;
      // Don't redirect if already on lockscreen or login page
      if (!currentPath.includes('/lockscreen') && !currentPath.includes('/login')) {
        // Store current URL to redirect back after unlock
        localStorage.setItem('redirectAfterUnlock', currentPath);
        navigate('/lockscreen');
      }
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel'
    ];

    const handleActivity = () => {
      const currentPath = window.location.pathname;
      // Only reset if not on lockscreen or login page
      if (!currentPath.includes('/lockscreen') && !currentPath.includes('/login')) {
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial start
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [navigate]);

  return { resetTimer };
};

export default useIdleTimer;