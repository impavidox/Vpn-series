import React, { useState, useEffect } from 'react';
import providerDict from './provider_dict.json';
import countryDict from './country_dict.json';
import './StreamingInfo.css';

function StreamingInfo({ selectedSeries, streaming }) {
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Filter providers based on selected streaming services
  const filterProviders = (providerData, allowedProviders) => {
    if (!allowedProviders || allowedProviders.length === 0) {
      // If no streaming providers are selected, show all providers
      return providerData || {};
    }

    return Object.fromEntries(
      Object.entries(providerData || {})
        .map(([country, providers]) => [
          country,
          Object.fromEntries(
            Object.entries(providers).filter(([provider]) =>
              allowedProviders.includes(provider)
            )
          ),
        ])
        .filter(([country, providers]) => Object.keys(providers).length > 0)
    );
  };

  const getStreamingProviders = (selectedSeries) => {
    if (selectedSeries && selectedSeries.provider_data) {
      return filterProviders(selectedSeries.provider_data, streaming);
    }
    return {};
  };

  // Calculate max seasons for progress bars
  const calculateMaxSeasons = (providers) => {
    let max = 0;
    Object.values(providers).forEach(seasons => {
      if (parseInt(seasons) > max) max = parseInt(seasons);
    });
    return max || 1; // Avoid division by zero
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
                  {Object.entries(providers).map(([provider, seasons], providerIndex) => {
                    const seasonCount = parseInt(seasons);
                    const percentComplete = (seasonCount / totalSeasons) * 100;
                    const isComplete = seasonCount >= totalSeasons;
                    
                    return (
                      <li key={providerIndex}>
                        <img 
                          src={`https://image.tmdb.org/t/p/w185/${providerDict[provider] || ''}`} 
                          alt={provider} 
                          className="provider-icon" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40x40?text=?';
                          }}
                        />
                        <div className="provider-info">
                          <div className="provider-header">
                            <span className="provider-name">{provider}</span>
                            {isComplete && <span className="availability-tag">Full Series</span>}
                          </div>
                          <span className="provider-seasons">
                            {seasons} of {totalSeasons} season{totalSeasons !== 1 ? 's' : ''}
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
                {showAllCountries ? "Show Less Countries" : `Show  More Countries`}
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
}

export default StreamingInfo;