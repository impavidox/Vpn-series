import React, { useState } from 'react';
import providerDict from './provider_dict.json'; // Adjust the path as necessary
import countryDict from './country_dict.json';  // Adjust the path as necessary
import './StreamingInfo.css';

function StreamingInfo({ selectedSeries, streaming }) {
  const [showAllCountries, setShowAllCountries] = useState(false);

  const filterProviders = (providerData, allowedProviders) => {
    return Object.fromEntries(
      Object.entries(providerData)
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

  const providersData = getStreamingProviders(selectedSeries);
  const countryEntries = Object.entries(providersData);
  const displayedCountries = showAllCountries ? countryEntries : countryEntries.slice(0, 3);

  return (
    <div className="streaming-info">
      <h3>Available on:</h3>
      {countryEntries.length > 0 ? (
        <div className="streaming-countries">
          {displayedCountries.map(([country, providers], countryIndex) => (
            <div key={countryIndex} className="country-block">
              <div className="country-header">
                {countryDict[country] || country}:
              </div>
              <ul className="provider-list">
                {Object.entries(providers).map(([provider, seasons], providerIndex) => (
                  <li key={providerIndex}>
                    <img 
                      src={'https://image.tmdb.org/t/p/w185/' + (providerDict[provider] || 'default-icon.png')} 
                      alt={provider} 
                      className="provider-icon" 
                    />
                    {provider} ({seasons} season{seasons > 1 ? 's' : ''})
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {countryEntries.length > 3 && (
            <div className="show-more-countries">
              <button onClick={() => setShowAllCountries(!showAllCountries)}>
                {showAllCountries ? "Show Less Countries" : "Show More Countries"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p>Streaming information not available for the selected country.</p>
      )}
    </div>
  );
}

export default StreamingInfo;
