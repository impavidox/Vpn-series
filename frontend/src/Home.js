import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const [phase, setPhase] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedStreaming, setSelectedStreaming] = useState([]);
  const navigate = useNavigate();

  const countryOptions = [
    { value: 'US', label: '🇺🇸 United States' },
    { value: 'IT', label: 'Italy' },
    { value: 'IN', label: '🇮🇳 India' },
    // Add more country options...
  ];

  const streamingOptions = [
    { value: 'Netflix', label: 'Netflix' },
    { value: 'Amazon Prime Video', label: 'Amazon Prime Video' },
    { value: 'Disney Plus', label: 'Disney+' }
    // Add more streaming options...
  ];

  const handleDiscoverNow = () => {
    const filterCriteria = {
      country: selectedCountry?.value,
      streaming: selectedStreaming,
    };
    navigate('/search', { state: filterCriteria });
  };

  const handleCountrySelection = (country) => {
    setSelectedCountry(country);
    setPhase(2);
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

  const handleBack = () => setPhase(1);

  return (
    <div className="home-container">
      <div className={`welcome-container phase-1 ${phase === 1 ? 'active' : ''}`}>
        <h1>Welcome to TV Series Explorer</h1>
        <p>Discover and explore your favorite TV series from a vast collection.</p>
        <button onClick={() => setPhase(2)} className="discover-button">Discover Now</button>
      </div>

      <div className={`country-grid phase-2 ${phase === 2 ? 'active' : ''}`}>
        <h2>Select Your Country</h2>
        <div className="country-grid-container">
          {countryOptions.map((country) => (
            <div
              key={country.value}
              className={`country-grid-item ${selectedCountry?.value === country.value ? 'selected' : ''}`}
              onClick={() => handleCountrySelection(country)}
            >
              {country.label}
            </div>
          ))}
        </div>
        <div className="button-container">
          <button
            onClick={() => setPhase(3)}
            className="next-button"
            disabled={!selectedCountry}
          >
            Next
          </button>
        </div>
      </div>

      <div className={`streaming-grid phase-3 ${phase === 3 ? 'active' : ''}`}>
        <h2>Select Your Streaming Provider(s)</h2>
        <div className="streaming-grid-container">
          {streamingOptions.map((streaming) => (
            <div
              key={streaming.value}
              className={`streaming-grid-item ${selectedStreaming.includes(streaming.value) ? 'selected' : ''}`}
              onClick={() => handleStreamingSelection(streaming.value)}
            >
              {streaming.label}
            </div>
          ))}
        </div>
        <div className="button-container">
          <button onClick={handleBack} className="back-button">Back</button>
          <button
            onClick={handleStartExploring}
            className="explore-button"
            disabled={selectedStreaming.length === 0}
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
