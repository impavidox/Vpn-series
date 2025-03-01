import React from 'react';
import PropTypes from 'prop-types';

/**
 * Filter trigger component with funnel icon
 * Used to open the filter popup
 * 
 * @param {Object} props - Component props
 * @param {number} props.activeFiltersCount - Number of active filters
 * @param {Function} props.onClick - Function to call when button is clicked
 */
const FilterTrigger = ({ activeFiltersCount = 0, onClick }) => {
  return (
    <button 
      className="filter-trigger-button" 
      onClick={onClick} 
      aria-label="Open filters"
    >
      <span className="filter-icon">🔍</span>
      <span className="funnel-icon">⚙️</span>
      {activeFiltersCount > 0 && (
        <span className="filter-count">{activeFiltersCount}</span>
      )}
    </button>
  );
};

FilterTrigger.propTypes = {
  activeFiltersCount: PropTypes.number,
  onClick: PropTypes.func.isRequired
};

export default FilterTrigger;