import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { GENRES } from '../../constants/genres';
import Button from '../common/Button';
import Input from '../common/Input';
import '../../styles/components/FilterPopup.css';

/**
 * Popup component for filtering search results
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
  
  // Reset local state when props change
  useEffect(() => {
    if (isOpen) {
      setLocalTitleFilter(titleFilter);
      setLocalYearFilter(yearFilter);
      setLocalGenres(selectedGenres);
      
      // Disable body scrolling when popup is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      // Re-enable body scrolling when component unmounts or closes
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, titleFilter, yearFilter, selectedGenres]);
  
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
  
  // Toggle a genre in the selection
  const toggleGenre = (genreId) => {
    setLocalGenres(prev => 
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Create portal for better stacking
  return createPortal(
    <div className="filter-popup-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="filter-popup" onClick={e => e.stopPropagation()}>
        <div className="filter-popup-header">
          <h3>Filter Content</h3>
          <button className="close-popup-btn" onClick={onClose} aria-label="Close filter popup">
            <span>×</span>
          </button>
        </div>
        
        <div className="filter-popup-content">
          <div className="filter-section">
            <h4>Search</h4>
            
            <Input
              label="Title"
              id="popup-title"
              type="text"
              value={localTitleFilter}
              onChange={(e) => setLocalTitleFilter(e.target.value)}
              placeholder="Filter by title"
            />
            
            <Input
              label="Year"
              id="popup-year"
              type="text"
              value={localYearFilter}
              onChange={(e) => setLocalYearFilter(e.target.value)}
              placeholder="Filter by year"
            />
          </div>
          
          <div className="filter-section">
            <h4>Genres</h4>
            <div className="genre-checkboxes" role="group" aria-label="Select genres">
              {GENRES.map((genre) => (
                <div key={genre.id} className="genre-checkbox">
                  <input
                    type="checkbox"
                    id={`genre-${genre.id}`}
                    checked={localGenres.includes(genre.id)}
                    onChange={() => toggleGenre(genre.id)}
                    aria-label={genre.name}
                  />
                  <label htmlFor={`genre-${genre.id}`}>
                    <span className="genre-icon" aria-hidden="true">{genre.icon}</span>
                    {genre.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="filter-popup-footer">
          <Button 
            onClick={handleClearAll} 
            variant="outline"
            aria-label="Clear all filters"
          >
            Clear All
          </Button>
          <Button 
            onClick={handleApply} 
            variant="primary"
            aria-label="Apply filters"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>,
    document.body
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