import React from 'react';
import PropTypes from 'prop-types';
import Logo from '../common/Logo';
import Button from '../common/Button';
import { getCountryName } from '../../utils/helpers';
import countryDict from '../../constants/countryDict';
import '../../styles/components/CountrySelector.css';

/**
 * Country selection component for the home page
 */
const CountrySelector = ({
  isActive,
  selectedContinent,
  selectedCountry,
  onCountrySelect,
  onBack,
  onNext
}) => {
  // Get the countries for the selected continent
  const getCountriesForContinent = () => {
    if (!selectedContinent) return [];
    
    const continentCountryCodes = selectedContinent.countries || [];
    return continentCountryCodes.map(code => ({
      id: code,
      name: getCountryName(code, countryDict)
    }));
  };

  return (
    <div className={`country-container ${isActive ? 'active' : ''}`}>
      <Logo showTagline={true} />
      <h2 className="section-title">Select Your Country</h2>
      {selectedContinent && (
        <h3 className="continent-subtitle">
          <span className="subtitle-icon" aria-hidden="true">{selectedContinent.icon}</span>
          <span>{selectedContinent.name}</span>
        </h3>
      )}
      
      <div 
        className="country-grid"
        role="listbox"
        aria-label="Countries"
      >
        {getCountriesForContinent().map((country) => (
          <div
            key={country.id}
            className={`country-item ${selectedCountry?.id === country.id ? 'selected' : ''}`}
            onClick={() => onCountrySelect(country)}
            role="option"
            tabIndex={isActive ? 0 : -1}
            aria-selected={selectedCountry?.id === country.id}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCountrySelect(country);
              }
            }}
          >
            <div className="flag-container">
              <img 
                src={`https://flagcdn.com/w80/${country.id.toLowerCase()}.png`}
                alt=""
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
        <Button 
          onClick={onBack} 
          variant="outline"
          disabled={!isActive}
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          variant="primary"
          disabled={!selectedCountry || !isActive}
        >
          Next
        </Button>
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