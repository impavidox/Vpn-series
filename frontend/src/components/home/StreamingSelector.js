import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import providerDict from '../../provider_dict.json';
import countryStreaming from '../../country_streaming_providers.json';

/**
 * Streaming service selection component that shows providers based on selected country
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether this screen is active
 * @param {Object} props.selectedCountry - The selected country object
 * @param {Array} props.selectedStreaming - Array of selected streaming services
 * @param {Function} props.onStreamingSelect - Function to call when a streaming service is selected
 * @param {Function} props.onBack - Function to call when the back button is clicked
 * @param {Function} props.onExplore - Function to call when the explore button is clicked
 */
const StreamingSelector = ({
  isActive,
  selectedCountry,
  selectedStreaming,
  onStreamingSelect,
  onBack,
  onExplore
}) => {
  const [countryProviders, setCountryProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch streaming providers for the selected country
  useEffect(() => {
    const fetchProviders = async () => {
      if (!selectedCountry) return;
      
      setIsLoading(true);
      try {
        // Load the country streaming providers data
        
        const data = countryStreaming
        
        // Get providers for the selected country
        const countryData = data[selectedCountry.id];
        if (countryData && countryData.providers) {
          setCountryProviders(countryData.providers);
        } else {
          setCountryProviders([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading streaming providers:', err);
        setError('Failed to load streaming providers for this country');
        setCountryProviders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [selectedCountry]);

  // Convert provider objects to the format expected by the component
  const getStreamingOptions = () => {
    return countryProviders.map(provider => ({
      value: provider.provider_id.toString(),
      label: provider.provider_name,
      icon: providerDict[provider.provider_name]
    }));
  };

  return (
    <div className={`streaming-container ${isActive ? 'active' : ''}`}>
      <h2 className="section-title">Select Your Streaming Provider(s)</h2>
      
      {isLoading ? (
        <div className="loading-container">
          <p>Loading streaming providers for {selectedCountry?.name}...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : countryProviders.length === 0 ? (
        <div className="no-providers-container">
          <p>No streaming providers found for {selectedCountry?.name}.</p>
        </div>
      ) : (
        <div className="streaming-grid">
          {getStreamingOptions().map((streaming) => (
            <div
              key={streaming.value}
              className={`streaming-item ${selectedStreaming.includes(streaming.label) ? 'selected' : ''}`}
              onClick={() => onStreamingSelect(streaming.label)}
            >
              <div className='provider-container'>
              <img 
                          src={`https://image.tmdb.org/t/p/w185/${streaming.icon || ''}`} 
                          alt={streaming.value} 
                          className="provider-icon" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40x40?text=?';
                          }}
                        />
              </div>
              <div className="streaming-name">{streaming.label}</div>
            </div>
          ))}
        </div>
      )}
      
      <p className="streaming-hint">
        Select all the streaming services you currently subscribe to.
      </p>
      
      <div className="button-container">
        <button onClick={onBack} className="back-button">Back</button>
        <button
          onClick={onExplore}
          className="explore-button"
          disabled={selectedStreaming.length === 0}
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
};

StreamingSelector.propTypes = {
  isActive: PropTypes.bool.isRequired,
  selectedCountry: PropTypes.object,
  selectedStreaming: PropTypes.array.isRequired,
  onStreamingSelect: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onExplore: PropTypes.func.isRequired
};

export default StreamingSelector;