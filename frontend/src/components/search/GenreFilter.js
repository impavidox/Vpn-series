// This is an updated version of the GenreFilter.js component with fixes
// for the filter dropdown positioning issues

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { GENRES } from '../../constants/genres';
import '../../styles/GenreFilter.css';

/**
 * Genre filter component with dropdown selection using React Portal
 * FIXED: Dropdown positioning and viewport boundary handling
 * 
 * @param {Object} props - Component props
 * @param {Array} props.selectedGenres - Currently selected genres
 * @param {Function} props.onGenreChange - Function to call when genres are changed
 * @param {Function} props.onDropdownToggle - Function to notify parent when dropdown opens/closes
 */
const GenreFilter = ({ selectedGenres, onGenreChange, onDropdownToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // IMPROVED: Calculate dropdown position with viewport boundary checks
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate initial position below the button
      let top = buttonRect.bottom + window.scrollY;
      let left = buttonRect.left + window.scrollX;
      let width = buttonRect.width;
      
      // Check if dropdown would extend beyond bottom of viewport
      // We'll estimate dropdown height as 350px maximum (from CSS)
      const estimatedHeight = Math.min(350, viewportHeight * 0.7);
      if (top + estimatedHeight > viewportHeight + window.scrollY) {
        // Position above button if not enough space below
        top = buttonRect.top + window.scrollY - estimatedHeight;
        
        // If still no space, position it at the bottom of the viewport with scroll
        if (top < window.scrollY) {
          top = window.scrollY + 10; // Small margin from top
        }
      }
      
      // Check if dropdown would extend beyond right edge of viewport
      if (left + width > viewportWidth) {
        // Adjust left position to keep it within viewport
        left = Math.max(10, viewportWidth - width - 10);
      }
      
      setDropdownPosition({ top, left, width });
    }
  };

  const toggleDropdown = () => {
    // Update position before opening
    if (!isOpen) {
      updateDropdownPosition();
    }
    
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Notify parent component about dropdown state change
    if (onDropdownToggle) {
      onDropdownToggle(newState);
    }
  };

  const handleGenreSelect = (genreId) => {
    // Toggle the selected genre
    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onGenreChange([...selectedGenres, genreId]);
    }
  };

  // Close dropdown when clicking outside
  const handleOutsideClick = (e) => {
    if (
      isOpen && 
      buttonRef.current && 
      dropdownRef.current && 
      !buttonRef.current.contains(e.target) && 
      !dropdownRef.current.contains(e.target)
    ) {
      setIsOpen(false);
      
      // Notify parent component that dropdown is closed
      if (onDropdownToggle) {
        onDropdownToggle(false);
      }
    }
  };

  // Update position on window resize or scroll
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    // FIX: Debounce for better performance
    const debouncedResize = debounce(handleResize, 100);
    const debouncedScroll = debounce(handleResize, 100);
    
    // Add event listeners
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('scroll', debouncedScroll);
    document.addEventListener('click', handleOutsideClick);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('scroll', debouncedScroll);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen]);

  // FIX: Added useEffect to close dropdown on viewport changes (orientation change, etc.)
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsOpen(false);
      if (onDropdownToggle) {
        onDropdownToggle(false);
      }
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [onDropdownToggle]);

  // Count of selected genres for display
  const selectedCount = selectedGenres.length;

  // Create portal for dropdown menu with improved positioning
  const dropdownPortal = isOpen && createPortal(
    <div 
      ref={dropdownRef}
      className="genre-dropdown-menu-portal"
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 9999
      }}
    >
      <div className="genre-menu-header">
        <h4>Select Genres</h4>
        {selectedCount > 0 && (
          <button 
            className="clear-genres" 
            onClick={(e) => {
              e.stopPropagation();
              onGenreChange([]);
            }}
            aria-label="Clear all selected genres"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="genre-options">
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
    </div>,
    document.body
  );

  return (
    <div className="genre-dropdown">
      <button 
        ref={buttonRef}
        className="genre-dropdown-toggle" 
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="genre-icon">🎭</span>
        <span className="genre-label">
          {selectedCount === 0 
            ? 'Genres' 
            : `Genres (${selectedCount})`}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {/* Dropdown rendered via Portal */}
      {dropdownPortal}
      
      {/* Selected genres pills */}
      {selectedCount > 0 && (
        <div className="selected-genres-container">
          <div className="selected-genres">
            {selectedGenres.map(genreId => {
              const genre = GENRES.find(g => g.id === genreId);
              if (!genre) return null;
              
              return (
                <div key={genre.id} className="genre-pill">
                  <span className="genre-pill-icon">{genre.icon}</span>
                  <span className="genre-pill-name">{genre.name}</span>
                  <button 
                    className="remove-genre" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenreSelect(genre.id);
                    }}
                    aria-label={`Remove ${genre.name} genre`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

GenreFilter.propTypes = {
  selectedGenres: PropTypes.array.isRequired,
  onGenreChange: PropTypes.func.isRequired,
  onDropdownToggle: PropTypes.func
};

export default GenreFilter;