import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import Logo from '../common/Logo';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import providerDict from '../../constants/providerDict';
import countryStreaming from '../../constants/countryStreamingProviders';
import '../../styles/components/StreamingSelector.css';

/**
 * Streaming service selection component for the home page
 */
const StreamingSelector = ({
  isActive,
  selectedCountry,
  selectedStreaming,
  onStreamingSelect,
  onBack,
  onExplore
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get streaming providers for the selected country
  const countryProviders = useMemo(() => {
    if (!selectedCountry) return [];
    
    try {
      // Get country data from our pre-loaded JSON
      const countryData = countryStreaming[selectedCountry.id];
      
      if (countryData && countryData.providers) {
        return countryData.providers;
      }
      
      return [];
    } catch (err) {
      console.error('Error processing streaming providers:', err);
      setError('Failed to load streaming providers for this country');
      return [];
    }
  }, [selectedCountry]);
  
  // Simulate loading state
  useEffect(() => {
    if (isActive) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, selectedCountry]);
  
  // Convert provider objects to the format expected by the component
  const streamingOptions = useMemo(() => {
    return countryProviders.map(provider => ({
      value: provider.provider_id.toString(),
      label: provider.provider_name,
      icon: providerDict[provider.provider_name]
    }));
  }, [countryProviders]);
  
  // Handle streaming service selection
  const handleStreamingSelect = (providerName) => {
    onStreamingSelect(providerName);
  };
  
  return (
    <div className={`streaming-container ${isActive ? 'active' : ''}`}>
      <Logo showTagline={true} />
      <h2 className="section-title">Select Your Streaming Provider(s)</h2>
      
      {isLoading ? (
        <Loader text={`Loading streaming providers for ${selectedCountry?.name}...`} />
      ) : error ? (
        <ErrorMessage 
          message={error} 
          retryAction={() => setIsLoading(true)}
        />
      ) : countryProviders.length === 0 ? (
        <div className="no-providers-container">
          <p>No streaming providers found for {selectedCountry?.name}.</p>
        </div>
      ) : (
        <div 
          className="streaming-grid"
          role="listbox"
          aria-label="Streaming services"
        >
          {streamingOptions.map((streaming) => (
            <div
              key={streaming.value}
              className={`streaming-item ${selectedStreaming.includes(streaming.label) ? 'selected' : ''}`}
              onClick={() => handleStreamingSelect(streaming.label)}
              role="option"
              tabIndex={isActive ? 0 : -1}
              aria-selected={selectedStreaming.includes(streaming.label)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStreamingSelect(streaming.label);
                }
              }}
            >
              <div className="provider-container">
                <img 
                  src={`https://image.tmdb.org/t/p/w185/${streaming.icon || ''}`} 
                  alt={`${streaming.label} logo`} 
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
        <Button 
          onClick={onBack} 
          variant="outline"
          disabled={!isActive}
        >
          Back
        </Button>
        
        <Button
          onClick={onExplore}
          variant="primary"
          disabled={selectedStreaming.length === 0 || !isActive}
        >
          Start Exploring
        </Button>
      </div>
    </div>
  );
};

export default StreamingSelector;