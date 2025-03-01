import React from 'react';
import PropTypes from 'prop-types';
import Logo from '../common/Logo';
import HeaderSearch from './HeaderSearch';
import { getCountryName } from '../../utils/helpers';
import countryDict from '../../country_dict.json';

/**
 * Updated Header component for the search page that includes search bar
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

  return (
    <div className={`search-header ${animationComplete ? 'animate-in' : ''}`}>
      <div className="search-header-content">
        <Logo onClick={onLogoClick} />
        
        <HeaderSearch 
          initialValue={titleFilter} 
          onSearch={onSearch} 
        />
        
        <div className="search-info" >
          <div className="search-region">
            <span className="region-icon">📍</span>
            <span className="region-text">
              Browsing content in <span className="highlight">{countryName}</span>
            </span>
          </div>
          
          <div className="search-streaming">
            <span className="streaming-icon">📺</span>
            <span className="streaming-text">
              {selectedStreamingProviders && selectedStreamingProviders.length > 0 
                ? `Filtering for ${selectedStreamingProviders.join(', ')}`
                : 'All streaming services'}
            </span>
          </div>
        </div>
      </div>
    </div>
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