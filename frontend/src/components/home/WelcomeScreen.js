import React from 'react';
import PropTypes from 'prop-types';
import Logo from '../common/Logo';
import FeatureGrid from './FeatureGrid';

/**
 * Welcome screen component for the home page
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether this screen is active
 * @param {Function} props.onBeginClick - Function to call when the Begin button is clicked
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
      
      <button onClick={onBeginClick} className="discover-button">
        Begin Your Journey
      </button>
    </div>
  );
};

WelcomeScreen.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onBeginClick: PropTypes.func.isRequired
};

export default WelcomeScreen;