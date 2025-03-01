import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Header Search component for the search page
 * Provides a search input directly in the header
 * 
 * @param {Object} props - Component props
 * @param {string} props.initialValue - Initial search value
 * @param {Function} props.onSearch - Function to call when search is submitted
 */
const HeaderSearch = ({ initialValue = '', onSearch }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="header-search">
      <form onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title"
            className="header-search-input"
            onKeyPress={handleKeyPress}
          />
          <button type="submit" className="search-submit-btn">
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

HeaderSearch.propTypes = {
  initialValue: PropTypes.string,
  onSearch: PropTypes.func.isRequired
};

export default HeaderSearch;