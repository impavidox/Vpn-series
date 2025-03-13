import React from 'react';
import PropTypes from 'prop-types';
import Loader from '../common/Loader';
import '../../styles/components/InfiniteScrollLoader.css';

/**
 * Loading component for infinite scrolling
 */
const InfiniteScrollLoader = ({ isLoading, hasMore, loaderRef }) => {
  if (!hasMore && !isLoading) return null;
  
  return (
    <div 
      ref={loaderRef}
      className="infinite-scroll-loader"
    >
      {isLoading && <Loader text="Loading more amazing content..." size="small" />}
      
      {!isLoading && hasMore && (
        <div className="scroll-indicator">
          <span>Scroll for more content</span>
          <div className="scroll-arrow" aria-hidden="true">↓</div>
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