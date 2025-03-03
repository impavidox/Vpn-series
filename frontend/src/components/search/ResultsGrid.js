import React, { useState } from 'react';
import PropTypes from 'prop-types';
import GridItem from './GridItem';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import FilterTrigger from './FilterTrigger';
import FilterPopup from './FilterPopup';
import { formatResultsCount } from '../../utils/helpers';
import { GENRES } from '../../constants/genres';

/**
 * Updated Grid component for displaying search results with filter popup
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
 * @param {Function} props.onApplyFilters - Function to call when filters are applied
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
  onApplyFilters,
  loaderRef
}) => {
  // State for filter popup
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  
  // Ensure we have a valid data array
  const safeData = Array.isArray(data) ? data : [];
  const formattedResultsCount = formatResultsCount(totalResults, safeData.length);

  // Calculate active filters count
  const activeFiltersCount = (
    (appliedTitleFilter ? 1 : 0) + 
    (appliedYearFilter ? 1 : 0) + 
    appliedGenreFilter.length
  );

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

  // Handle applying filters from the popup
  const handleApplyFilters = (title, year, genres) => {
    if (onApplyFilters) {
      onApplyFilters(title, year, genres);
    }
    setIsFilterPopupOpen(false);
  };

  return (
    <div className={`results-section ${animationComplete ? 'animate-in' : ''}`}>
      <div className="results-header">
        <div className="results-filter-container">
          <h2>
            {safeData.length > 0 ? (
              <>
                <span className="results-count-container">
                  <span className="results-count">{formattedResultsCount}</span> shows found
                </span>
                {appliedTitleFilter && ` for "${appliedTitleFilter}"`}
                {appliedYearFilter && ` in ${appliedYearFilter}`}
                {genreString && ` in genres: ${genreString}`}
                {(totalResults !== '1000+' && safeData.length < totalResults) || totalResults === '1000+' ? (
                  <span className="showing-count">Showing {safeData.length}</span>
                ) : null}
              </>
            ) : isLoading && safeData.length === 0 ? (
              'Searching for content...'
            ) : (
              'Ready to discover shows'
            )}
          </h2>
          
          <FilterTrigger 
            activeFiltersCount={activeFiltersCount}
            onClick={() => setIsFilterPopupOpen(true)}
          />
        </div>
      </div>

      {/* Filter popup with proper content and positioning */}
      {isFilterPopupOpen && (
        <FilterPopup 
          isOpen={isFilterPopupOpen}
          onClose={() => setIsFilterPopupOpen(false)}
          titleFilter={appliedTitleFilter}
          yearFilter={appliedYearFilter}
          selectedGenres={appliedGenreFilter}
          onApplyFilters={handleApplyFilters}
        />
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
  onApplyFilters: PropTypes.func.isRequired,
  loaderRef: PropTypes.object
};

export default ResultsGrid;