import React from 'react';
import PropTypes from 'prop-types';
import GridItem from './GridItem';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import { formatResultsCount } from '../../utils/helpers';
import { GENRES } from '../../constants/genres';

/**
 * Grid component for displaying search results
 * Updated with support for genre filtering
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of search results
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {boolean} props.hasMore - Whether there are more results to load
 * @param {string|number} props.totalResults - Total number of results
 * @param {string} props.appliedTitleFilter - Applied title filter
 * @param {string} props.appliedYearFilter - Applied year filter
 * @param {Array} props.appliedGenreFilter - Applied genre filters
 * @param {boolean} props.animationComplete - Whether animations are complete
 * @param {Function} props.onItemClick - Function to call when an item is clicked
 * @param {React.RefObject} props.loaderRef - Ref for the loader element
 */
const ResultsGrid = ({
  data = [],
  isLoading = false,
  hasMore = false,
  totalResults = 0,
  appliedTitleFilter = '',
  appliedYearFilter = '',
  appliedGenreFilter = [],
  animationComplete = false,
  onItemClick,
  loaderRef
}) => {
  // Ensure we have a valid data array
  const safeData = Array.isArray(data) ? data : [];
  const formattedResultsCount = formatResultsCount(totalResults, safeData.length);

  // Get genre names for display
  const getGenreNames = () => {
    if (!appliedGenreFilter || appliedGenreFilter.length === 0) return '';
    
    const genreNames = appliedGenreFilter.map(genreId => {
      const genre = GENRES.find(g => g.id === genreId);
      return genre ? genre.name : '';
    }).filter(Boolean);
    
    return genreNames.join(', ');
  };
  
  const genreString = getGenreNames();

  return (
    <div className={`results-section ${animationComplete ? 'animate-in' : ''}`}>
      <div className="results-header">
        <h2>
          {safeData.length > 0 ? (
            <>
              <span className="results-count">{formattedResultsCount}</span> shows found
              {appliedTitleFilter && ` for "${appliedTitleFilter}"`}
              {appliedYearFilter && ` in ${appliedYearFilter}`}
              {genreString && ` in genres: ${genreString}`}
              {totalResults !== '1000+' && safeData.length < totalResults && 
                <span className="showing-count"> (Showing {safeData.length})</span>
              }
              {totalResults === '1000+' && 
                <span className="showing-count"> (Showing {safeData.length})</span>
              }
            </>
          ) : isLoading && safeData.length === 0 ? (
            'Searching for content...'
          ) : (
            'Ready to discover shows'
          )}
        </h2>
      </div>

      {/* Applied filters display */}
      {(appliedTitleFilter || appliedYearFilter || appliedGenreFilter.length > 0) && (
        <div className="applied-filters">
          <div className="applied-filters-title">Active filters:</div>
          <div className="applied-filters-list">
            {appliedTitleFilter && (
              <div className="applied-filter-tag">
                <span className="filter-tag-icon">🔍</span>
                <span>Title: {appliedTitleFilter}</span>
              </div>
            )}
            
            {appliedYearFilter && (
              <div className="applied-filter-tag">
                <span className="filter-tag-icon">📅</span>
                <span>Year: {appliedYearFilter}</span>
              </div>
            )}
            
            {appliedGenreFilter.map(genreId => {
              const genre = GENRES.find(g => g.id === genreId);
              if (!genre) return null;
              
              return (
                <div key={genreId} className="applied-filter-tag genre-tag">
                  <span className="filter-tag-icon">{genre.icon}</span>
                  <span>{genre.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid-container">
        {safeData.map((item, index) => {
          // Ensure item is valid
          if (!item) return null;
          
          return (
            <GridItem 
              key={`${item._id || item.id || index}`}
              item={item}
              onClick={onItemClick}
            />
          );
        })}
      </div>

      {/* Only render the loader if we have a valid ref */}
      {loaderRef && (
        <InfiniteScrollLoader 
          isLoading={isLoading}
          hasMore={hasMore}
          loaderRef={loaderRef}
        />
      )}

      {!hasMore && safeData.length > 0 && (
        <div className="end-results-message">
          <span className="end-icon">🎬</span>
          <p>You've reached the end of the list! No more results to show.</p>
          <p className="end-suggestion">Maybe it's time to take a break? 🛋️🍿</p>
        </div>
      )}

      {!isLoading && safeData.length === 0 && !hasMore && (
        <div className="no-results-message">
          <span className="no-results-icon">🔍</span>
          <p>No shows found matching your criteria.</p>
          <p>Try adjusting your filters or exploring different streaming services.</p>
        </div>
      )}
    </div>
  );
};

ResultsGrid.propTypes = {
  data: PropTypes.array,
  isLoading: PropTypes.bool,
  hasMore: PropTypes.bool,
  totalResults: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  appliedTitleFilter: PropTypes.string,
  appliedYearFilter: PropTypes.string,
  appliedGenreFilter: PropTypes.array,
  animationComplete: PropTypes.bool,
  onItemClick: PropTypes.func.isRequired,
  loaderRef: PropTypes.object
};

export default ResultsGrid;