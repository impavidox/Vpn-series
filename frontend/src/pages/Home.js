import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSelection } from '../context/UserSelectionContext';

// Components
import AnimatedBackground from '../components/common/AnimatedBackground';
import Footer from '../components/common/Footer';
import WelcomeScreen from '../components/home/WelcomeScreen';
import ContinentSelector from '../components/home/ContinentSelector';
import CountrySelector from '../components/home/CountrySelector';
import StreamingSelector from '../components/home/StreamingSelector';
import SkipLink from '../components/common/SkipLink';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Styles
import '../styles/pages/Home.css';

/**
 * Home page component with multi-step selection process
 */
const Home = () => {
  // Navigation
  const navigate = useNavigate();

  // Global context
  const {
    selectedCountry,
    setSelectedCountry,
    selectedStreaming,
    handleStreamingSelection,
    selectedContinent,
    setSelectedContinent,
    resetSelections
  } = useUserSelection();

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

  // Navigate to search page with selected filters
  const handleStartExploring = () => {
    navigate('/search');
  };

  // Go back to a previous step
  const handleBack = (step) => setPhase(step);

  return (
    <div className={`home-container ${animateBackground ? 'animated-background' : ''}`}>
      <SkipLink targetId="main-content" />
      
      {/* Animated background */}
      <AnimatedBackground />
      
      <main id="main-content">
        <ErrorBoundary>
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
            onNext={() => {
              // Only proceed if a country is selected
              if (selectedCountry) {
                setPhase(4);
              }
            }}
          />

          {/* Streaming services selection */}
          <StreamingSelector 
            isActive={phase === 4}
            selectedCountry={selectedCountry}
            selectedStreaming={selectedStreaming}
            onStreamingSelect={handleStreamingSelection}
            onBack={() => handleBack(3)}
            onExplore={handleStartExploring}
          />
        </ErrorBoundary>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;