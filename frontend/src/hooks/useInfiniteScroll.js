import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for implementing infinite scrolling functionality
 * With added safeguards to prevent null reference errors
 * 
 * @param {Function} fetchMore - Function to fetch more data
 * @param {boolean} hasMore - Whether there is more data to load
 * @param {number} threshold - Intersection threshold (0-1)
 * @param {string} rootMargin - Root margin for intersection observer
 * @returns {Object} - Refs and state for infinite scrolling
 */
const useInfiniteScroll = (
  fetchMore,
  hasMore = true,
  threshold = 0.1,
  rootMargin = '0px 0px 500px 0px'
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const loaderRef = useRef(null);
  const observerRef = useRef(null);
  const initialLoadDone = useRef(false);
  const isComponentMounted = useRef(true);

  // Callback to handle intersection
  const handleObserver = useCallback(
    (entries) => {
      // Safety check - if the component isn't mounted, exit early
      if (!isComponentMounted.current) return;
      
      // Make sure we have entries to process
      if (!entries || entries.length === 0) return;
      
      const [entry] = entries;
      
      // Only proceed if the element is intersecting (visible) and we're not already loading
      if (entry && entry.isIntersecting && hasMore && !isLoading) {
        // Don't trigger additional loads for the initial render
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
          return;
        }
        
        setPage((prevPage) => prevPage + 1);
      }
    },
    [hasMore, isLoading]
  );

  // Set up the intersection observer
  useEffect(() => {
    // Disconnect any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Don't create a new observer if we don't have more content or already loading
    if (!hasMore || isLoading) return;

    const options = {
      root: null, // viewport is the root
      rootMargin,
      threshold,
    };

    // Create new observer
    try {
      observerRef.current = new IntersectionObserver(handleObserver, options);

      // If we have a loader element, start observing it
      if (loaderRef.current) {
        observerRef.current.observe(loaderRef.current);
      }
    } catch (error) {
      console.error("Error initializing IntersectionObserver:", error);
    }

    // Cleanup function to disconnect the observer when component unmounts
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, handleObserver, rootMargin, threshold]);

  // Track component mounted state
  useEffect(() => {
    isComponentMounted.current = true;
    
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  // Fetch more data when page changes
  useEffect(() => {
    // Skip the initial page change as data should already be loaded
    if (page === 1) return;
    
    // Only fetch if component is still mounted
    if (!isComponentMounted.current) return;
    
    const loadMore = async () => {
      setIsLoading(true);
      try {
        await fetchMore(page);
      } catch (error) {
        console.error("Error fetching more data:", error);
      } finally {
        // Only update state if component is still mounted
        if (isComponentMounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadMore();
  }, [page, fetchMore]);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setPage(1);
    initialLoadDone.current = false;
  }, []);

  return {
    loaderRef,
    isLoading,
    resetPagination,
    page,
  };
};

export default useInfiniteScroll;