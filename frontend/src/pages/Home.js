import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// Component imports
import AnimatedBackground from '../components/common/AnimatedBackground';
import Footer from '../components/common/Footer';
import WelcomeScreen from '../components/home/WelcomeScreen';
import ContinentSelector from '../components/home/ContinentSelector';
import CountrySelector from '../components/home/CountrySelector';
import StreamingSelector from '../components/home/StreamingSelector';

// Styles
import '../styles/Home.css';

/**
 * Home page component
 * Contains all the steps for setting up search criteria
 */
const Home = () => {
  // Navigation
  const navigate = useNavigate();

  // Global context
  const {
    selectedCountry,
    setSelectedCountry,
    selectedStreaming,
    setSelectedStreaming,
    selectedContinent,
    setSelectedContinent
  } = useAppContext();

  // Local state
  const [phase, setPhase] = useState(1);
  const [animateBackground, setAnimateBackground] = useState(false);

  // Initialize animations
  useEffect(() => {
    setTimeout(() => setAnimateBackground(true), 500);
    document.body.classList.add('animated-bg');
    
    return () => {
      document.body.classList.remove('animated-bg');
    };
  }, []);

  // Handle selection of a continent
  const handleContinentSelect = (continent) => {
    setSelectedContinent(continent);
    setPhase(3); // Move to country selection
  };

  // Handle selection of a country
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  // Handle selection of streaming services
  const handleStreamingSelection = (streaming) => {
    setSelectedStreaming((prevSelected) =>
      prevSelected.includes(streaming)
        ? prevSelected.filter((s) => s !== streaming)
        : [...prevSelected, streaming]
    );
  };

  // Navigate to search page with selected filters
  const handleStartExploring = () => {
    const filterCriteria = {
      country: selectedCountry?.id,
      streaming: selectedStreaming,
    };
    navigate('/search', { state: filterCriteria });
  };

  // Go back to a previous step
  const handleBack = (step) => setPhase(step);

  return (
    <div className={`home-container ${animateBackground ? 'animated-background' : ''}`}>
      {/* Animated background */}
      <AnimatedBackground />
      
      {/* Welcome screen */}
      <WelcomeScreen 
        isActive={phase === 1} 
        onBeginClick={() => setPhase(2)} 
      />

      {/* Continent selection */}
      <ContinentSelector 
        isActive={phase === 2}
        onContinentSelect={handleContinentSelect}
      />

      {/* Country selection */}
      <CountrySelector 
        isActive={phase === 3}
        selectedContinent={selectedContinent}
        selectedCountry={selectedCountry}
        onCountrySelect={handleCountrySelect}
        onBack={() => handleBack(2)}
        onNext={() => setPhase(4)}
      />

      {/* Streaming services selection */}
      <StreamingSelector 
        isActive={phase === 4}
        selectedStreaming={selectedStreaming}
        onStreamingSelect={handleStreamingSelection}
        onBack={() => handleBack(3)}
        onExplore={handleStartExploring}
      />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;