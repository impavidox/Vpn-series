import React, { useState, useEffect, useCallback } from 'react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Use useCallback to memoize the scroll handler to prevent unnecessary re-creation
  const handleScroll = useCallback(() => {
    // Get current scroll position - try multiple methods for compatibility
    let scrollPosition = 0;
    
    // Try different browser-compatible ways to get scroll position
    if (typeof window !== 'undefined') {
      scrollPosition = window.scrollY || window.pageYOffset || 
                       (document.documentElement && document.documentElement.scrollTop) || 
                       (document.body && document.body.scrollTop) || 0;
    }
    
    // Update visibility state based on scroll position
    if (scrollPosition > 100) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, []);

  // Simple throttle function to limit how often the scroll handler fires
  const throttle = (callback, limit) => {
    let waiting = false;
    return function() {
      if (!waiting) {
        callback.apply(this, arguments);
        waiting = true;
        setTimeout(() => {
          waiting = false;
        }, limit);
      }
    };
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    // Create throttled version of scroll handler (fires at most every 100ms)
    const throttledHandleScroll = throttle(handleScroll, 100);
    
    // Check initial scroll position on mount
    handleScroll();
    
    // Add event listener with throttling
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    // Debug scroll position - remove in production
    console.log('ScrollToTop mounted, initial visibility:', isVisible);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      console.log('ScrollToTop unmounted');
    };
  }, [handleScroll]); // Only re-run if handleScroll changes (it shouldn't due to useCallback)

  return (
    <button
      onClick={scrollToTop}
      className={`scroll-to-top-button ${isVisible ? 'visible' : ''}`}
      aria-label="Scroll to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
};

export default ScrollToTop;