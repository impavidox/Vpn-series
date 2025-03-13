import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import GridItem from './GridItem';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import FilterTrigger from './FilterTrigger';
import FilterPopup from './FilterPopup';
import ErrorMessage from '../common/ErrorMessage';
import Loader from '../common/Loader';
import { formatResultsCount } from '../../utils/helpers';
import { GENRES } from '../../constants/genres';
import '../../styles/components/ResultsGrid.css';

/**
 * Grid component for displaying search results
 */
const ResultsGrid = ({
  data = [],
  isLoading = false,
  hasMore = false,
  totalResults = 0,
  appliedTitleFilter = '',
  appliedYearFilter = '',
  appliedGenreFilter = [],
  error = null,
  onItemClick,
  onApplyFilters,
  loaderRef
}) => {
  // State for filter popup
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  
  // Ensure we have a valid data array
  const safeData = Array.isArray(data) ? data : [];
  
  // Format the results count for display
  const formattedResultsCount = formatResultsCount(totalResults, safeData.length);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return (
      (appliedTitleFilter ? 1 : 0) + 
      (appliedYearFilter ? 1 : 0) + 
      appliedGenreFilter.length
    );
  }, [appliedTitleFilter, appliedYearFilter, appliedGenreFilter]);

  // Get genre names for display
  const genreNames = useMemo(() => {
    if (!appliedGenreFilter || appliedGenreFilter.length === 0) return '';
    
    const names = appliedGenreFilter
      .map(genreId => {
        const genre = GENRES.find(g => g.id === genreId);
        return genre ? genre.name : '';
      })
      .filter(Boolean);
    
    return names.join(', ');
  }, [appliedGenreFilter]);

  // Handle applying filters from the popup
  const handleApplyFilters = (title, year, genres) => {
    if (onApplyFilters) {
      onApplyFilters(title, year, genres);
    }
    setIsFilterPopupOpen(false);
  };

  return (
    <div className="results-section">
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
                {genreNames && ` in genres: ${genreNames}`}
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

      {/* Filter popup */}
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

      {/* Error message */}
      {error && (
        <ErrorMessage 
          message={error}
          retryAction={() => onApplyFilters(appliedTitleFilter, appliedYearFilter, appliedGenreFilter)}
        />
      )}

      {/* Grid of results */}
      <div className="grid-container">
        {safeData.map((item, index) => {
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

      {/* Loading indicator and infinity scroll loader */}
      {isLoading && safeData.length === 0 ? (
        <Loader text="Searching for shows..." />
      ) : (
        loaderRef && (
          <InfiniteScrollLoader 
            isLoading={isLoading}
            hasMore={hasMore}
            loaderRef={loaderRef}
          />
        )
      )}

      {/* End of results message */}
      {!hasMore && safeData.length > 0 && !isLoading && (
        <div className="end-results-message">
          <span className="end-icon" role="img" aria-label="Movie icon">🎬</span>
          <p>You've reached the end of the list! No more results to show.</p>
          <p className="end-suggestion">Maybe it's time to take a break? 🛋️🍿</p>
        </div>
      )}

      {/* No results message */}
      {!isLoading && safeData.length === 0 && !error && (
        <div className="no-results-message">
          <span className="no-results-icon" role="img" aria-label="Search icon">🔍</span>
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
  error: PropTypes.string,
  onItemClick: PropTypes.func.isRequired,
  onApplyFilters: PropTypes.func.isRequired,
  loaderRef: PropTypes.object,
};

export default React.memo(ResultsGrid);