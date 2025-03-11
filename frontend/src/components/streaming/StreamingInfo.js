import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import providerDict from '../../provider_dict.json';
import countryDict from '../../country_dict.json';
import { filterProviders, calculateMaxSeasons } from '../../utils/helpers';
import '../../styles/StreamingInfo.css';

/**
 * Streaming information component for the series modal
 * 
 * @param {Object} props - Component props
 * @param {Object} props.selectedSeries - The selected series data
 * @param {Array} props.streaming - Selected streaming providers
 */
const StreamingInfo = ({ selectedSeries, streaming }) => {
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  const getStreamingProviders = (selectedSeries) => {
    if (selectedSeries && selectedSeries.provider_data) {
      return filterProviders(selectedSeries.provider_data, streaming);
    }
    return {};
  };

  const providersData = getStreamingProviders(selectedSeries);
  const countryEntries = Object.entries(providersData);
  const displayedCountries = showAllCountries ? countryEntries : countryEntries.slice(0, 3);
  
  // Get the total number of seasons for the show
  const totalSeasons = selectedSeries?.number_of_seasons || 0;

  return (
    <div className={`streaming-info ${isVisible ? 'visible' : ''}`}>
      {countryEntries.length > 0 ? (
        <div className="streaming-countries">
          {displayedCountries.map(([country, providers], countryIndex) => {
            const maxSeasons = calculateMaxSeasons(providers);
            
            return (
              <div 
                key={countryIndex} 
                className="country-block" 
                style={{ '--index': countryIndex }}
              >
                <div className="country-header">
                  <img 
                    src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
                    alt={`${country} flag`}
                    className="country-flag"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                  {countryDict[country] || country}
                </div>
                <ul className="provider-list">
                  {Object.entries(providers).map(([providerName, providerInfo], providerIndex) => {
                    const seasonCount = parseInt(providerInfo.count);
                    const percentComplete = (seasonCount / totalSeasons) * 100;
                    const isComplete = seasonCount >= totalSeasons;
                    
                    return (
                      <li key={providerIndex}>
                        <img 
                          src={`https://image.tmdb.org/t/p/w185/${providerDict[providerName] || ''}`} 
                          alt={providerName} 
                          className="provider-icon" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40x40?text=?';
                          }}
                        />
                        <div className="provider-info">
                          <div className="provider-header">
                            <span className="provider-name">{providerName}</span>
                            {isComplete && <span className="availability-tag">Full Series</span>}
                            {/* {providerInfo.type && (
                              <span className="provider-type">{providerInfo.type}</span>
                            )} */}
                          </div>
                          <span className="provider-seasons">
                            {seasonCount} of {totalSeasons} season{totalSeasons !== 1 ? 's' : ''}
                          </span>
                          <div className="season-progress">
                            <div 
                              className="season-progress-bar" 
                              style={{ width: `${percentComplete}%` }}
                            ></div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
  
          {countryEntries.length > 3 && (
            <div className="show-more-countries">
              <button onClick={() => setShowAllCountries(!showAllCountries)}>
                {showAllCountries ? "Show Less Countries" : `Show More Countries`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="no-streaming-info">
          <p>No streaming information available for the selected services.</p>
          <p className="streaming-suggestion">Try selecting different streaming providers or check back later for updates.</p>
        </div>
      )}
    </div>
  );};

StreamingInfo.propTypes = {
  selectedSeries: PropTypes.object,
  streaming: PropTypes.array
};

export default StreamingInfo;