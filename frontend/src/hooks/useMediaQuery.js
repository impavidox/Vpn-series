import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design based on media queries
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    // Define callback for changes
    const listener = (event) => {
      setMatches(event.matches);
    };
    
    // Add listener
    media.addEventListener('change', listener);
    
    // Clean up
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};

// Predefined queries
export const useIsMobile = () => {
  return useMediaQuery('(max-width: 768px)');
};

export const useIsTablet = () => {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
};

export const useIsDesktop = () => {
  return useMediaQuery('(min-width: 1025px)');
};

export default useMediaQuery;