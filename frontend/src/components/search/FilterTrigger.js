import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/FilterTrigger.css';

/**
 * Button to trigger filter popup
 */
const FilterTrigger = ({ activeFiltersCount = 0, onClick }) => {
  return (
    <button 
      className="filter-trigger-button" 
      onClick={onClick} 
      aria-label="Open filters"
    >
      <img className='funnel-icon' src='filter.svg' alt="" aria-hidden="true" />
      {activeFiltersCount > 0 && (
        <span className="filter-count" aria-label={`${activeFiltersCount} active filters`}>
          {activeFiltersCount}
        </span>
      )}
    </button>
  );
};

FilterTrigger.propTypes = {
  activeFiltersCount: PropTypes.number,
  onClick: PropTypes.func.isRequired
};

export default FilterTrigger;