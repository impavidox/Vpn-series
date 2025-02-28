import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Loader from '../common/Loader';

/**
 * A specialized loader component for infinite scrolling
 * Handles visibility tracking with IntersectionObserver logic
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether data is currently loading
 * @param {boolean} props.hasMore - Whether there is more data to load
 * @param {Function} props.loaderRef - Ref callback for the loader element
 */
const InfiniteScrollLoader = ({ isLoading, hasMore, loaderRef }) => {
  const componentRef = useRef(null);
  
  // This effect ensures the loader is only visible when near the viewport
  useEffect(() => {
    // Safety check - if the component is not mounted, don't proceed
    if (!componentRef.current) return;
    
    // Add a class to make loader only appear when it's about to enter the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only proceed if the component is still mounted
        if (componentRef.current && entry) {
          if (entry.isIntersecting) {
            componentRef.current.classList.add('visible');
          } else {
            componentRef.current.classList.remove('visible');
          }
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observer.observe(componentRef.current);
    
    return () => {
      // Properly clean up the observer
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);
  
  // Don't render anything if there's no more data and we're not loading
  if (!hasMore && !isLoading) return null;
  
  return (
    <div 
      ref={(el) => {
        // Set both refs - our visual state ref and the scrolling trigger ref
        componentRef.current = el;
        if (loaderRef && typeof loaderRef === 'object') {
          loaderRef.current = el;
        }
      }}
      className="infinite-scroll-loader"
    >
      {isLoading && (
        <Loader text="Loading more amazing content..." visible={true} />
      )}
      
      {!isLoading && hasMore && (
        <div className="scroll-indicator">
          <span>Scroll for more content</span>
          <div className="scroll-arrow">↓</div>
        </div>
      )}
    </div>
  );
};

InfiniteScrollLoader.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  loaderRef: PropTypes.object
};

export default InfiniteScrollLoader;