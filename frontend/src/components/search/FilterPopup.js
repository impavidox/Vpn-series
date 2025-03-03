import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { GENRES } from '../../constants/genres';

/**
 * Genre dropdown select component for mobile filter popup
 * Uses inline styles to ensure compatibility with overflowing dropdown
 */
const GenreDropdownSelect = ({ selectedGenres = [], onGenreChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef(null);
  
  // Calculate dropdown position on open
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);
  
  // Close dropdown if user clicks outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isOpen && triggerRef.current && !triggerRef.current.contains(e.target) && 
          !e.target.closest('.genre-dropdown-menu')) {
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

  const dropdownContainerStyle = {
    width: '100%',
    marginBottom: '15px',
    position: 'relative'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: '#ccc',
    fontSize: '0.9rem'
  };

  const dropdownTriggerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3e3e3e',
    border: `1px solid ${isOpen ? '#43BCCD' : '#555'}`,
    borderRadius: '5px',
    color: 'white',
    padding: '10px 15px',
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative'
  };

  const dropdownIconStyle = {
    color: '#999',
    fontSize: '0.8rem',
    transition: 'transform 0.3s ease',
    transform: isOpen ? 'rotate(180deg)' : 'none'
  };

  const countBadgeStyle = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#EF8354',
    color: 'white',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  };

  // Styles for the dropdown menu portal
  const dropdownMenuStyle = {
    position: 'fixed',
    top: `${dropdownPosition.top}px`,
    left: `${dropdownPosition.left}px`,
    width: `${dropdownPosition.width}px`,
    background: '#272727',
    borderRadius: '5px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    zIndex: 10000, // Higher z-index to overflow the popup
    border: '1px solid #43BCCD',
    overflow: 'hidden'
  };

  const dropdownHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1e1e1e'
  };

  const clearButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#EF8354',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '3px 8px'
  };

  const optionsListStyle = {
    maxHeight: '250px',
    overflowY: 'auto',
    padding: '10px 0',
    margin: 0
  };

  const optionStyle = (isSelected) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '8px 15px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isSelected ? 'rgba(67, 188, 205, 0.2)' : 'transparent',
    color: 'white',
    listStyle: 'none'
  });

  const optionIconStyle = {
    marginRight: '10px',
    fontSize: '1.1rem'
  };

  const selectedIconStyle = {
    color: '#43BCCD',
    fontWeight: 'bold',
    marginLeft: 'auto'
  };

  const chipsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px'
  };

  const chipStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 188, 205, 0.2)',
    border: '1px solid rgba(67, 188, 205, 0.3)',
    borderRadius: '20px',
    padding: '5px 10px',
    fontSize: '0.85rem',
    color: 'white'
  };

  const removeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: '1.2rem',
    cursor: 'pointer',
    marginLeft: '5px',
    padding: '0 3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div style={dropdownContainerStyle} className="genre-dropdown-container">
      <label style={labelStyle}>Genres</label>
      
      {/* Dropdown trigger button */}
      <div 
        ref={triggerRef}
        style={dropdownTriggerStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{color: selectedCount > 0 ? 'white' : '#aaa'}}>
          {getSelectedGenreSummary()}
        </span>
        <span style={dropdownIconStyle}>▼</span>
        
        {selectedCount > 0 && (
          <span style={countBadgeStyle}>{selectedCount}</span>
        )}
      </div>
      
      {/* Dropdown menu as portal */}
      {isOpen && createPortal(
        <div className="genre-dropdown-menu" style={dropdownMenuStyle}>
          <div style={dropdownHeaderStyle}>
            <h4 style={{margin: 0, color: 'white', fontSize: '1rem'}}>Select Genres</h4>
            {selectedCount > 0 && (
              <button 
                style={clearButtonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onGenreChange([]);
                }}
              >
                Clear All
              </button>
            )}
          </div>
          
          <ul style={optionsListStyle}>
            {GENRES.map((genre) => (
              <li 
                key={genre.id} 
                style={optionStyle(selectedGenres.includes(genre.id))}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenreSelect(genre.id);
                }}
              >
                <span style={optionIconStyle}>{genre.icon}</span>
                <span style={{flex: 1}}>{genre.name}</span>
                {selectedGenres.includes(genre.id) && (
                  <span style={selectedIconStyle}>✓</span>
                )}
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
      
    </div>
  );
};

GenreDropdownSelect.propTypes = {
  selectedGenres: PropTypes.array,
  onGenreChange: PropTypes.func.isRequired
};

/**
 * Filter popup component using React Portal to ensure proper viewport positioning
 * Updated with mobile-friendly genre dropdown that overflows the popup
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
      // Re-enable body scrolling when component unmounts
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

  // Add the component to the body element if it's open
  if (!isOpen) return null;

  // Styles for React Portal implementation
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box',
    padding: '20px',
    overflow: 'hidden' // Prevent scrolling on the overlay
  };

  const popupStyle = {
    backgroundColor: '#272727',
    width: '90%',
    maxWidth: '600px',
    borderRadius: '10px',
    boxShadow: '0 0 30px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    overflow: 'hidden',
    border: '1px solid #43BCCD',
    margin: '0 auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1e1e1e',
    width: '100%',
    boxSizing: 'border-box'
  };

  const closeButtonStyle = {
    width: '36px',
    height: '36px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF8354',
    color: 'white',
    fontSize: '24px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer'
  };

  const contentStyle = {
    padding: '20px',
    overflowY: 'auto',
    overflowX: 'hidden', // Prevent horizontal scroll
    backgroundColor: '#272727',
    maxHeight: 'calc(90vh - 120px)', // Account for header and footer
    flex: '1',
    width: '100%',
    boxSizing: 'border-box'
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1e1e1e',
    width: '100%',
    boxSizing: 'border-box'
  };

  const applyButtonStyle = {
    backgroundColor: '#EF8354',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold'
  };

  const clearButtonStyle = {
    backgroundColor: 'transparent',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    backgroundColor: '#3e3e3e',
    border: '1px solid #43BCCD',
    borderRadius: '5px',
    color: 'white',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    color: '#ccc'
  };

  const sectionStyle = {
    marginBottom: '20px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const sectionTitleStyle = {
    color: '#43BCCD',
    marginBottom: '10px',
    borderBottom: '1px solid #43BCCD',
    paddingBottom: '5px'
  };

  // Use React Portal to render directly to body
  return createPortal(
    <div 
      style={overlayStyle} 
      onClick={(e) => {
        // Only close if clicking the overlay background
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{margin: 0, color: 'white'}}>Filter Content</h3>
          <button style={closeButtonStyle} onClick={onClose}>
            <span style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>×</span>
          </button>
        </div>
        
        <div style={contentStyle}>
          <div style={sectionStyle}>
            <h4 style={sectionTitleStyle}>Search</h4>
            
            <label style={labelStyle} htmlFor="portal-title">Title</label>
            <input
              id="portal-title"
              type="text"
              style={inputStyle}
              value={localTitleFilter}
              onChange={(e) => setLocalTitleFilter(e.target.value)}
              placeholder="Filter by title"
            />
            
            <label style={labelStyle} htmlFor="portal-year">Year</label>
            <input
              id="portal-year"
              type="text"
              style={inputStyle}
              value={localYearFilter}
              onChange={(e) => setLocalYearFilter(e.target.value)}
              placeholder="Filter by year"
            />
          </div>
          
          <div style={sectionStyle}>
            <h4 style={sectionTitleStyle}>Genres</h4>
            <GenreDropdownSelect 
              selectedGenres={localGenres}
              onGenreChange={setLocalGenres}
            />
          </div>
        </div>
        
        <div style={footerStyle}>
          <button style={clearButtonStyle} onClick={handleClearAll}>
            Clear All
          </button>
          <button style={applyButtonStyle} onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body // Render directly to document.body
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