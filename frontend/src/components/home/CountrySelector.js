import React from 'react';
import PropTypes from 'prop-types';
import countryDict from '../../country_dict.json';
import Logo from '../common/Logo';

/**
 * Country selection component for the home page
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether this screen is active
 * @param {Object} props.selectedContinent - The selected continent
 * @param {Object} props.selectedCountry - The currently selected country
 * @param {Function} props.onCountrySelect - Function to call when a country is selected
 * @param {Function} props.onBack - Function to call when the back button is clicked
 * @param {Function} props.onNext - Function to call when the next button is clicked
 */
const CountrySelector = ({
  isActive,
  selectedContinent,
  selectedCountry,
  onCountrySelect,
  onBack,
  onNext
}) => {
  const getCountriesForContinent = () => {
    if (!selectedContinent) return [];
    
    const continentCountryCodes = selectedContinent.countries || [];
    return continentCountryCodes.map(code => ({
      id: code,
      name: countryDict[code] || code
    }));
  };

  return (
    <div className={`country-container ${isActive ? 'active' : ''}`}>
      <Logo showTagline={true} />
      <h2 className="section-title">Select Your Country</h2>
      {selectedContinent && (
        <h3 className="continent-subtitle">
          <span className="subtitle-icon"><img className="subtitle-img" src={selectedContinent.icon}></img></span>
          <span>{selectedContinent.name}</span>
        </h3>
      )}
      
      <div className="country-grid">
        {getCountriesForContinent().map((country) => (
          <div
            key={country.id}
            className={`country-item ${selectedCountry?.id === country.id ? 'selected' : ''}`}
            onClick={() => onCountrySelect(country)}
          >
            <div className="flag-container">
              <img 
                src={`https://flagcdn.com/w80/${country.id.toLowerCase()}.png`}
                alt={`${country.name} flag`}
                className="flag-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="country-name">{country.name}</div>
          </div>
        ))}
      </div>
      
      <div className="button-container">
        <button onClick={onBack} className="back-button">Back</button>
        <button
          onClick={onNext}
          className="next-button"
          disabled={!selectedCountry}
        >
          Next
        </button>
      </div>
    </div>
  );
};

CountrySelector.propTypes = {
  isActive: PropTypes.bool.isRequired,
  selectedContinent: PropTypes.object,
  selectedCountry: PropTypes.object,
  onCountrySelect: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default CountrySelector;