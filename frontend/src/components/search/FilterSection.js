import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Filter section component for the search page
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.animationComplete - Whether animations are complete
 * @param {Function} props.onApplyFilters - Function to call when filters are applied
 */
const FilterSection = ({ animationComplete, onApplyFilters }) => {
  const [titleFilter, setTitleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const handleFilter = () => {
    onApplyFilters(titleFilter, yearFilter);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
  };

  return (
    <div className={`filter-section ${animationComplete ? 'animate-in' : ''}`}>
      <div className="filter-container">
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
        
        <button onClick={handleFilter} className="filter-button">
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