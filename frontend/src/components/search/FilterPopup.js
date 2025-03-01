import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { GENRES } from '../../constants/genres';

/**
 * Filter popup component using React Portal to ensure proper viewport positioning
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
    padding: '20px'
  };

  const popupStyle = {
    backgroundColor: '#272727',
    width: '90%',
    maxWidth: '600px',
    borderRadius: '10px',
    boxShadow: '0 0 30px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80vh',
    overflow: 'hidden',
    border: '1px solid #43BCCD'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1e1e1e'
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
    backgroundColor: '#272727',
    maxHeight: 'calc(80vh - 120px)', // Account for header and footer
    flex: '1'
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1e1e1e'
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
    color: 'white'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    color: '#ccc'
  };

  const sectionStyle = {
    marginBottom: '20px'
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
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
              {GENRES.slice(0, 8).map((genre) => (
                <div key={genre.id} style={{
                  padding: '8px', 
                  backgroundColor: localGenres.includes(genre.id) ? 'rgba(239, 131, 84, 0.2)' : '#3e3e3e',
                  borderRadius: '5px', 
                  marginBottom: '5px',
                  border: localGenres.includes(genre.id) ? '1px solid #EF8354' : '1px solid transparent'
                }}>
                  <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'white', width: '100%'}}>
                    <input
                      type="checkbox"
                      checked={localGenres.includes(genre.id)}
                      onChange={() => {
                        if (localGenres.includes(genre.id)) {
                          setLocalGenres(localGenres.filter(id => id !== genre.id));
                        } else {
                          setLocalGenres([...localGenres, genre.id]);
                        }
                      }}
                      style={{marginRight: '8px'}}
                    />
                    <span style={{marginRight: '5px'}}>{genre.icon}</span>
                    {genre.name}
                  </label>
                </div>
              ))}
            </div>
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