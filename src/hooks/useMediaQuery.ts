import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const media = window.matchMedia(query);

    // Sync state on mount/query change
    setMatches(media.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      // @ts-ignore - legacy API
      media.addListener(handler);
      return () => {
        // @ts-ignore - legacy API
        media.removeListener(handler);
      };
    }
  }, [query]);

  return matches;
};

export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 991px)');
};
