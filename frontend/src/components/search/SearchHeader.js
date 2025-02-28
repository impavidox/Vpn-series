import React from 'react';
import PropTypes from 'prop-types';
import Logo from '../common/Logo';
import { getCountryName } from '../../utils/helpers';
import countryDict from '../../country_dict.json';

/**
 * Header component for the search page
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.animationComplete - Whether animations are complete
 * @param {string} props.country - Country code
 * @param {Array} props.selectedStreamingProviders - Selected streaming providers
 * @param {Function} props.onLogoClick - Function to call when the logo is clicked
 */
const SearchHeader = ({
  animationComplete,
  country,
  selectedStreamingProviders,
  onLogoClick
}) => {
  const countryName = getCountryName(country, countryDict);

  return (
    <div className={`search-header ${animationComplete ? 'animate-in' : ''}`}>
      <div className="search-header-content">
        <Logo onClick={onLogoClick} />
        
        <div className="search-info">
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
  onLogoClick: PropTypes.func.isRequired
};

export default SearchHeader;