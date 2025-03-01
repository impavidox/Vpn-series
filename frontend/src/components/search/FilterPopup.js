import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GENRES } from '../../constants/genres';

/**
 * Filter popup component that shows when clicking the funnel icon
 * Provides filter options in a popup
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the popup is open
 * @param {Function} props.onClose - Function to call when popup is closed
 * @param {string} props.titleFilter - Current title filter
 * @param {string} props.yearFilter - Current year filter
 * @param {Array} props.selectedGenres - Currently selected genres
 * @param {Function} props.onApplyFilters - Function to call when filters are applied
 */
const FilterPopup = ({ 
  isOpen, 
  onClose, 
  titleFilter = '', 
  yearFilter = '', 
  selectedGenres = [],
  onApplyFilters 
}) => {
  const [localTitleFilter, setLocalTitleFilter] = useState(titleFilter);
  const [localYearFilter, setLocalYearFilter] = useState(yearFilter);
  const [localGenres, setLocalGenres] = useState(selectedGenres);
  
  const popupRef = useRef(null);

  // Reset local state when popup opens
  useEffect(() => {
    if (isOpen) {
      setLocalTitleFilter(titleFilter);
      setLocalYearFilter(yearFilter);
      setLocalGenres(selectedGenres);
      
      // Disable body scrolling when popup is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scrolling when popup is closed
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, titleFilter, yearFilter, selectedGenres]);

  // Handle clicks outside the popup to close it
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  const handleGenreToggle = (genreId) => {
    setLocalGenres(prevGenres => {
      if (prevGenres.includes(genreId)) {
        return prevGenres.filter(id => id !== genreId);
      } else {
        return [...prevGenres, genreId];
      }
    });
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(localTitleFilter, localYearFilter, localGenres);
    }
    onClose();
  };

  const handleClearAll = () => {
    setLocalTitleFilter('');
    setLocalYearFilter('');
    setLocalGenres([]);
  };

  if (!isOpen) return null;

  return (
    <div className="filter-popup-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="filter-popup" ref={popupRef} style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div className="filter-popup-header">
          <h3>Filter Content</h3>
          <button className="close-popup-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="filter-popup-content">
          <div className="filter-section">
            <h4>Search</h4>
            <div className="filter-input-group">
              <label htmlFor="title-filter">Title</label>
              <input
                id="title-filter"
                type="text"
                value={localTitleFilter}
                onChange={(e) => setLocalTitleFilter(e.target.value)}
                placeholder="Filter by title"
                className="popup-filter-input"
              />
            </div>
            
            <div className="filter-input-group">
              <label htmlFor="year-filter">Year</label>
              <input
                id="year-filter"
                type="text"
                value={localYearFilter}
                onChange={(e) => setLocalYearFilter(e.target.value)}
                placeholder="Filter by year"
                className="popup-filter-input"
              />
            </div>
          </div>
          
          <div className="filter-section">
            <h4>Genres</h4>
            <div className="genre-checkboxes">
              {GENRES.map((genre) => (
                <div key={genre.id} className="genre-checkbox">
                  <input
                    type="checkbox"
                    id={`genre-${genre.id}`}
                    checked={localGenres.includes(genre.id)}
                    onChange={() => handleGenreToggle(genre.id)}
                  />
                  <label htmlFor={`genre-${genre.id}`}>
                    <span className="genre-icon">{genre.icon}</span>
                    {genre.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="filter-popup-footer">
          <button className="clear-filters-btn" onClick={handleClearAll}>
            Clear All
          </button>
          <button className="apply-filters-btn" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

FilterPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  titleFilter: PropTypes.string,
  yearFilter: PropTypes.string,
  selectedGenres: PropTypes.array,
  onApplyFilters: PropTypes.func.isRequired
};

export default FilterPopup;