import React from 'react';
import PropTypes from 'prop-types';
import Logo from '../common/Logo';
import { getCountryName } from '../../utils/helpers';
import countryDict from '../../constants/countryDict';
import '../../styles/components/SearchHeader.css';

/**
 * Header component for the search page
 */
const SearchHeader = ({
  country,
  selectedStreamingProviders,
  onLogoClick,
  titleFilter = '',
  onSearch
}) => {
  const countryName = getCountryName(country, countryDict);

  return (
    <div className="search-header">
      <div className="search-header-content">
        <button className="menu-button" aria-label="Menu">
          <img className="hamburger-img" src='hamburger.svg' alt="" aria-hidden="true" />
        </button>
        
        <Logo onClick={onLogoClick} />
        
        <button 
          className="search-button"
          aria-label="Search"
          onClick={() => onSearch && onSearch(titleFilter)}
        >
          <img className="search-img" src='search.svg' alt="" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

SearchHeader.propTypes = {
  country: PropTypes.string,
  selectedStreamingProviders: PropTypes.array,
  onLogoClick: PropTypes.func.isRequired,
  titleFilter: PropTypes.string,
  onSearch: PropTypes.func
};

export default SearchHeader;