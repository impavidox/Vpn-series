import React from 'react';
import PropTypes from 'prop-types';
import Logo from '../common/Logo';
import Button from '../common/Button';
import FeatureGrid from './FeatureGrid';
import '../../styles/components/WelcomeScreen.css';

/**
 * Welcome screen component for the home page
 */
const WelcomeScreen = ({ isActive, onBeginClick }) => {
  return (
    <div className={`welcome-container ${isActive ? 'active' : ''}`}>
      <Logo showTagline={true} />
      
      <h2 className="welcome-title">Unlock Global Streaming Content</h2>
      <p className="welcome-description">
        Discover shows and movies available on streaming services around the world. 
        Find hidden gems that aren't available in your region and expand your entertainment horizons.
      </p>
      
      <FeatureGrid />
      
      <Button 
        onClick={onBeginClick} 
        className="discover-button" 
        variant="primary"
        size="large"
        isFullWidth
        disabled={!isActive}
      >
        Begin Your Journey
      </Button>
    </div>
  );
};

WelcomeScreen.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onBeginClick: PropTypes.func.isRequired
};

export default WelcomeScreen;