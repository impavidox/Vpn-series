import React, { useState } from 'react';
import PropTypes from 'prop-types';
import GenreFilter from './GenreFilter';

/**
 * Filter section component for the search page
 * Updated to use the portal-based genre filter component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.animationComplete - Whether animations are complete
 * @param {Function} props.onApplyFilters - Function to call when filters are applied
 */
const FilterSection = ({ animationComplete, onApplyFilters }) => {
  const [titleFilter, setTitleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

  const handleFilter = () => {
    // Close dropdown before applying filters
    setIsGenreDropdownOpen(false);
    onApplyFilters(titleFilter, yearFilter, selectedGenres);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
  };

  const handleGenreChange = (genres) => {
    setSelectedGenres(genres);
  };

  // Add dropdown state control
  const handleGenreDropdownToggle = (isOpen) => {
    setIsGenreDropdownOpen(isOpen);
  };

  return (
    <div className={`filter-section ${animationComplete ? 'animate-in' : ''}`}>
      <div className="filter-container">
        <div className="filter-row">
          <div className="input-group">
            <span className="input-icon">🔍</span>
            <input
              type="text"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Search by title"
              className="filter-input"
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <div className="input-group">
            <span className="input-icon">📅</span>
            <input
              type="text"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              placeholder="Filter by year"
              className="filter-input"
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
        
        {/* Portal-based Genre filter */}
        <GenreFilter
          selectedGenres={selectedGenres}
          onGenreChange={handleGenreChange}
          onDropdownToggle={handleGenreDropdownToggle}
        />
        
        <button onClick={handleFilter} className="filter-button">
          <span className="filter-icon">🔍</span>
          <span className="button-text">Apply Filters</span>
        </button>
      </div>
    </div>
  );
};

FilterSection.propTypes = {
  animationComplete: PropTypes.bool.isRequired,
  onApplyFilters: PropTypes.func.isRequired
};

export default FilterSection;