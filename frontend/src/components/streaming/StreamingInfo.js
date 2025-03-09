import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import providerDict from '../../provider_dict.json';
import countryDict from '../../country_dict.json';
import { filterProviders, calculateMaxSeasons } from '../../utils/helpers';
import '../../styles/StreamingInfo.css';
import Loader from '../common/Loader';

/**
 * Streaming information component for the series modal
 * Enhanced to handle loading states and fallbacks
 * Orders countries by completeness of seasons
 * 
 * @param {Object} props - Component props
 * @param {Object} props.selectedSeries - The selected series data
 * @param {Array} props.streaming - Selected streaming providers
 * @param {boolean} props.isLoading - Whether streaming data is loading
 */
const StreamingInfo = ({ selectedSeries, streaming, isLoading = false }) => {
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Process streaming provider data
  const getStreamingProviders = (selectedSeries) => {
    if (!selectedSeries) return {};
    
    // Handle both formats - provider_data from API and directly from object
    const providerData = selectedSeries.provider_data || selectedSeries.providers;
    
    if (!providerData || Object.keys(providerData).length === 0) {
      return {};
    }
    
    return filterProviders(providerData, streaming);
  };

  const providersData = getStreamingProviders(selectedSeries);
  // Get the total number of seasons for the show
  const totalSeasons = selectedSeries?.number_of_seasons || 0;
  
  // Sort countries by completeness of their seasons
  const sortedCountryEntries = Object.entries(providersData).sort((a, b) => {
    const [, providersA] = a;
    const [, providersB] = b;
    
    // Find the provider with the highest season count in each country
    const highestCountA = Object.values(providersA).reduce((max, providerInfo) => {
      const seasonCount = typeof providerInfo === 'object' 
        ? parseInt(providerInfo.count || 1) 
        : parseInt(providerInfo || 1);
      return Math.max(max, seasonCount);
    }, 0);
    
    const highestCountB = Object.values(providersB).reduce((max, providerInfo) => {
      const seasonCount = typeof providerInfo === 'object' 
        ? parseInt(providerInfo.count || 1) 
        : parseInt(providerInfo || 1);
      return Math.max(max, seasonCount);
    }, 0);
    
    // Calculate the highest percentage of completeness for each country
    const percentCompleteA = totalSeasons > 0 ? (highestCountA / totalSeasons) : 0;
    const percentCompleteB = totalSeasons > 0 ? (highestCountB / totalSeasons) : 0;
    
    // Sort in descending order (most complete first)
    return percentCompleteB - percentCompleteA;
  });
  
  const displayedCountries = showAllCountries ? sortedCountryEntries : sortedCountryEntries.slice(0, 3);

  if (isLoading) {
    return (
      <div className="streaming-info-loading">
        <Loader text="Loading streaming availability..." visible={true} />
      </div>
    );
  }

  return (
    <div className={`streaming-info ${isVisible ? 'visible' : ''}`}>
      {sortedCountryEntries.length > 0 ? (
        <div className="streaming-countries">
          {displayedCountries.map(([country, providers], countryIndex) => {
            // Find the highest season count among all providers in this country
            const highestSeasonCount = Object.values(providers).reduce((max, providerInfo) => {
              const seasonCount = typeof providerInfo === 'object' 
                ? parseInt(providerInfo.count || 1) 
                : parseInt(providerInfo || 1);
              return Math.max(max, seasonCount);
            }, 0);
            
            const countryCompletenessPercent = totalSeasons > 0 
              ? Math.round((highestSeasonCount / totalSeasons) * 100) 
              : 100;
            
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
                  <span>{countryDict[country] || country}</span>

                </div>
                <ul className="provider-list">
                  {Object.entries(providers).map(([providerName, providerInfo], providerIndex) => {
                    // Handle both formats - direct value or object with count
                    const seasonCount = typeof providerInfo === 'object' 
                      ? parseInt(providerInfo.count || 1) 
                      : parseInt(providerInfo || 1);
                    
                    const percentComplete = totalSeasons > 0 
                      ? (seasonCount / totalSeasons) * 100 
                      : 100;
                    
                    const isComplete = totalSeasons > 0 
                      ? seasonCount >= totalSeasons 
                      : true;
                    
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
                            {seasonCount} of {totalSeasons || 1} season{(totalSeasons || 1) !== 1 ? 's' : ''}
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
  
          {sortedCountryEntries.length > 3 && (
            <div className="show-more-countries">
              <button onClick={() => setShowAllCountries(!showAllCountries)}>
                {showAllCountries ? "Show Less Countries" : `Show More Countries (${sortedCountryEntries.length - 3} more)`}
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
  );
};

StreamingInfo.propTypes = {
  selectedSeries: PropTypes.object,
  streaming: PropTypes.array,
  isLoading: PropTypes.bool
};

export default StreamingInfo;