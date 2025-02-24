import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import countryDict from './country_dict.json';

function Home() {
  const [phase, setPhase] = useState(1);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedStreaming, setSelectedStreaming] = useState([]);
  const [animateBackground, setAnimateBackground] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Start background animation after component mounts
    setTimeout(() => setAnimateBackground(true), 500);
    
    // Add an animated background class to body
    document.body.classList.add('animated-bg');
    
    return () => {
      // Clean up
      document.body.classList.remove('animated-bg');
    };
  }, []);

  // Define continents with their countries
  const continents = [
    {
      id: 'north-america',
      name: 'North America',
      icon: '🌎',
      colors: 'from-blue-500 to-cyan-400',
      countries: ['US', 'CA', 'MX']
    },
    {
      id: 'south-america',
      name: 'South America',
      icon: '🌎',
      colors: 'from-green-500 to-emerald-400',
      countries: ['BR', 'AR']
    },
    {
      id: 'europe',
      name: 'Europe',
      icon: '🌍',
      colors: 'from-orange-500 to-amber-400',
      countries: ['GB', 'FR', 'DE', 'IT', 'ES', 'SE', 'NL', 'CH', 'PL', 'BE', 'AT', 'DK', 'FI', 'NO', 'IE', 'PT', 'GR', 'CZ', 'HU', 'SK', 'RO', 'BG']
    },
    {
      id: 'asia',
      name: 'Asia',
      icon: '🌏',
      colors: 'from-red-500 to-pink-400',
      countries: ['CN', 'JP', 'IN', 'KR', 'ID', 'VN', 'RU', 'TR', 'SA']
    },
    {
      id: 'oceania',
      name: 'Oceania',
      icon: '🌏',
      colors: 'from-purple-500 to-violet-400',
      countries: ['AU']
    },
    {
      id: 'africa',
      name: 'Africa',
      icon: '🌍',
      colors: 'from-yellow-500 to-amber-400',
      countries: ['ZA']
    }
  ];

  const streamingOptions = [
    { value: 'Netflix', label: 'Netflix', icon: '📺' },
    { value: 'Amazon Prime Video', label: 'Prime Video', icon: '🎬' },
    { value: 'Disney Plus', label: 'Disney+', icon: '✨' },
    { value: 'HBO Max', label: 'Max', icon: '🎭' },
    { value: 'Hulu', label: 'Hulu', icon: '📱' },
    { value: 'Apple TV Plus', label: 'Apple TV+', icon: '🍎' }
  ];

  // Handle continent selection
  const handleContinentSelect = (continent) => {
    setSelectedContinent(continent);
    setPhase(3);  // Move to country selection phase
  };

  // Handle country selection from continent
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const handleDiscoverNow = () => {
    const filterCriteria = {
      country: selectedCountry?.id,
      streaming: selectedStreaming,
    };
    navigate('/search', { state: filterCriteria });
  };

  const handleStreamingSelection = (streaming) => {
    setSelectedStreaming((prevSelected) =>
      prevSelected.includes(streaming)
        ? prevSelected.filter((s) => s !== streaming)
        : [...prevSelected, streaming]
    );
  };

  const handleStartExploring = () => {
    handleDiscoverNow();
  };

  const handleBack = (step) => setPhase(step);

  // Get countries for selected continent
  const getCountriesForContinent = () => {
    if (!selectedContinent) return [];
    
    const continentCountryCodes = selectedContinent.countries || [];
    return continentCountryCodes.map(code => ({
      id: code,
      name: countryDict[code] || code
    }));
  };



  return (
    <div className={`home-container ${animateBackground ? 'animated-background' : ''}`}>
      {/* Animated background elements */}
      <div className="background-animations">
        <div className="bg-orb orb-cyan"></div>
        <div className="bg-orb orb-orange"></div>
        <div className="bg-orb orb-yellow"></div>
      </div>
      
      <div className={`welcome-container ${phase === 1 ? 'active' : ''}`}>
        <div className="logo-container">
          <h1 className="logo">
            <span className="logo-part-1">Beyond</span>
            <span className="logo-part-2">Flix</span>
            <span className="logo-emoji">🌍</span>
          </h1>
          <div className="logo-tagline">GO BEYOND BORDERS</div>
        </div>
        
        <h2 className="welcome-title">Unlock Global Streaming Content</h2>
        <p className="welcome-description">
          Discover shows and movies available on streaming services around the world. 
          Find hidden gems that aren't available in your region and expand your entertainment horizons.
        </p>
        
        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon cyan">🔍</div>
            <div className="feature-content">
              <h3>Global Search</h3>
              <p>Find content across multiple streaming platforms worldwide</p>
            </div>
          </div>
          
          <div className="feature-box">
            <div className="feature-icon orange">🎭</div>
            <div className="feature-content">
              <h3>Hidden Gems</h3>
              <p>Discover exclusive regional content not available at home</p>
            </div>
          </div>
          
          <div className="feature-box">
            <div className="feature-icon yellow">📊</div>
            <div className="feature-content">
              <h3>Trending Analysis</h3>
              <p>See what's popular in different countries right now</p>
            </div>
          </div>
          
          <div className="feature-box">
            <div className="feature-icon green">🔐</div>
            <div className="feature-content">
              <h3>Legal Access</h3>
              <p>Learn how to access region-locked content without hassle</p>
            </div>
          </div>
        </div>
        
        <button onClick={() => setPhase(2)} className="discover-button">
          Begin Your Journey
        </button>
      </div>

      {/* Continent selection */}
      <div className={`continent-container ${phase === 2 ? 'active' : ''}`}>
        <h2 className="section-title">Select Your Continent</h2>
        <div className="continent-grid">
          {continents.map((continent) => (
            <div
              key={continent.id}
              className="continent-item"
              onClick={() => handleContinentSelect(continent)}
            >
              <div className={`continent-inner bg-gradient-to-br ${continent.colors}`}>
                <div className="continent-icon">{continent.icon}</div>
                <div className="continent-name">{continent.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Country selection */}
      <div className={`country-container ${phase === 3 ? 'active' : ''}`}>
        <h2 className="section-title">Select Your Country</h2>
        {selectedContinent && (
          <h3 className="continent-subtitle">
            <span className="subtitle-icon">{selectedContinent.icon}</span>
            <span>{selectedContinent.name}</span>
          </h3>
        )}
        
        <div className="country-grid">
  {getCountriesForContinent().map((country) => (
    <div
      key={country.id}
      className={`country-item ${selectedCountry?.id === country.id ? 'selected' : ''}`}
      onClick={() => handleCountrySelect(country)}
    >
      <div className="flag-container">
        <img 
          src={`https://flagcdn.com/w80/${country.id.toLowerCase()}.png`}
          alt={`${country.name} flag`}
          className="flag-image"
        />
      </div>
      <div className="country-name">{country.name}</div>
    </div>
  ))}
</div>
        
        <div className="button-container">
          <button onClick={() => handleBack(2)} className="back-button">Back</button>
          <button
            onClick={() => setPhase(4)}
            className="next-button"
            disabled={!selectedCountry}
          >
            Next
          </button>
        </div>
      </div>

      {/* Streaming services selection */}
      <div className={`streaming-container ${phase === 4 ? 'active' : ''}`}>
        <h2 className="section-title">Select Your Streaming Provider(s)</h2>
        <div className="streaming-grid">
          {streamingOptions.map((streaming) => (
            <div
              key={streaming.value}
              className={`streaming-item ${selectedStreaming.includes(streaming.value) ? 'selected' : ''}`}
              onClick={() => handleStreamingSelection(streaming.value)}
            >
              <div className="streaming-icon">{streaming.icon}</div>
              <div className="streaming-name">{streaming.label}</div>
            </div>
          ))}
        </div>
        <p className="streaming-hint">
          Select all the streaming services you currently subscribe to.
        </p>
        <div className="button-container">
          <button onClick={() => handleBack(3)} className="back-button">Back</button>
          <button
            onClick={handleStartExploring}
            className="explore-button"
            disabled={selectedStreaming.length === 0}
          >
            Start Exploring
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="footer">
        <p>© 2025 BeyondFlix | Not affiliated with any streaming service</p>
      </div>
    </div>
  );
}

export default Home;