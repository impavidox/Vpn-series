import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Logo from '../common/Logo';
import SlidingMenu from './SlidingMenu';
import { getCountryName } from '../../utils/helpers';
import countryDict from '../../country_dict.json';
import { useLocation } from 'react-router-dom';

/**
 * Updated Header component for the search page that includes search bar
 * and sliding menu functionality
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.animationComplete - Whether animations are complete
 * @param {string} props.country - Country code
 * @param {Array} props.selectedStreamingProviders - Selected streaming providers
 * @param {Function} props.onLogoClick - Function to call when the logo is clicked
 * @param {string} props.titleFilter - Current title filter
 * @param {Function} props.onSearch - Function to call when search is performed
 */
const SearchHeader = ({
  animationComplete,
  country,
  selectedStreamingProviders,
  onLogoClick,
  titleFilter = '',
  onSearch
}) => {
  const countryName = getCountryName(country, countryDict);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  return (
    <>
      <div className={`search-header ${animationComplete ? 'animate-in' : ''} ${menuOpen ? 'header-opaque' : ''}`}>
        <div className="search-header-content">
          <img 
            className="hamburger-img" 
            src='hamburger.svg' 
            alt="Menu"
            onClick={toggleMenu}
          />
          <Logo onClick={onLogoClick} />
          <img className="search-img" src='search.svg' alt="Search" />
        </div>
      </div>
      
      {/* Sliding Menu Component */}
      <SlidingMenu 
        isOpen={menuOpen}
        onClose={closeMenu}
        currentRoute={location.pathname}
      />
    </>
  );
};

SearchHeader.propTypes = {
  animationComplete: PropTypes.bool.isRequired,
  country: PropTypes.string,
  selectedStreamingProviders: PropTypes.array,
  onLogoClick: PropTypes.func.isRequired,
  titleFilter: PropTypes.string,
  onSearch: PropTypes.func
};

export default SearchHeader;