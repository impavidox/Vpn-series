import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for infinite scrolling
 */
const useInfiniteScroll = (
  fetchMore,
  hasMore = true,
  isLoading = false,
  threshold = 0.1,
  rootMargin = '0px 0px 500px 0px'
) => {
  const loaderRef = useRef(null);
  const observerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Reset the observer when dependencies change
  const resetObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Callback to handle intersection
  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasMore && !isLoading && isMountedRef.current) {
        fetchMore();
      }
    },
    [fetchMore, hasMore, isLoading]
  );

  // Set up the intersection observer
  useEffect(() => {
    // Reset observer on dependency changes
    resetObserver();
    
    // Don't create new observer if no more items or already loading
    if (!hasMore || isLoading || !loaderRef.current) return;

    const options = {
      root: null,
      rootMargin,
      threshold,
    };

    try {
      observerRef.current = new IntersectionObserver(handleObserver, options);
      observerRef.current.observe(loaderRef.current);
    } catch (error) {
      console.error("Error initializing IntersectionObserver:", error);
    }

    return resetObserver;
  }, [hasMore, isLoading, handleObserver, rootMargin, threshold, resetObserver]);

  // Clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      resetObserver();
    };
  }, [resetObserver]);

  return { loaderRef };
};

export default useInfiniteScroll;