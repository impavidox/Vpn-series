import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GENRES } from '../../constants/genres';

/**
 * Genre dropdown select component for mobile filter popup
 * 
 * @param {Object} props - Component props
 * @param {Array} props.selectedGenres - Currently selected genres
 * @param {Function} props.onGenreChange - Function to call when genres change
 */
const GenreDropdownSelect = ({ selectedGenres = [], onGenreChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close dropdown if user clicks outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isOpen && !e.target.closest('.genre-dropdown-select')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  // Toggle genre selection
  const handleGenreSelect = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onGenreChange([...selectedGenres, genreId]);
    }
  };

  // Get count and summary of selected genres
  const selectedCount = selectedGenres.length;
  const getSelectedGenreSummary = () => {
    if (selectedCount === 0) return 'Select genres...';
    if (selectedCount === 1) {
      const genre = GENRES.find(g => g.id === selectedGenres[0]);
      return genre ? genre.name : 'One genre selected';
    }
    return `${selectedCount} genres selected`;
  };

  return (
    <div className="genre-dropdown-select">
      <div className="genre-input-label">Genres</div>
      
      {/* Dropdown trigger button */}
      <div 
        className={`genre-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="genre-trigger-text">
          {getSelectedGenreSummary()}
        </span>
        <span className="dropdown-icon">{isOpen ? '▲' : '▼'}</span>
        
        {selectedCount > 0 && (
          <span className="selected-count">{selectedCount}</span>
        )}
      </div>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="genre-options-dropdown">
          <div className="dropdown-header">
            <h4>Select Genres</h4>
            {selectedCount > 0 && (
              <button 
                className="clear-genres" 
                onClick={(e) => {
                  e.stopPropagation();
                  onGenreChange([]);
                }}
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="genre-options-list">
            {GENRES.map((genre) => (
              <div 
                key={genre.id} 
                className={`genre-option ${selectedGenres.includes(genre.id) ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenreSelect(genre.id);
                }}
              >
                <span className="genre-option-icon">{genre.icon}</span>
                <span className="genre-option-name">{genre.name}</span>
                {selectedGenres.includes(genre.id) && (
                  <span className="genre-selected-icon">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Selected genres display */}
      {selectedCount > 0 && (
        <div className="selected-genres-chips">
          {selectedGenres.map(genreId => {
            const genre = GENRES.find(g => g.id === genreId);
            if (!genre) return null;
            
            return (
              <div key={genre.id} className="genre-chip">
                <span className="genre-chip-icon">{genre.icon}</span>
                <span className="genre-chip-name">{genre.name}</span>
                <button 
                  className="remove-genre" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenreSelect(genre.id);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

GenreDropdownSelect.propTypes = {
  selectedGenres: PropTypes.array,
  onGenreChange: PropTypes.func.isRequired
};

export default GenreDropdownSelect;