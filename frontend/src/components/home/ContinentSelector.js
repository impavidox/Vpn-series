import React from 'react';
import PropTypes from 'prop-types';
import { CONTINENTS } from '../../constants/continents';
import Logo from '../common/Logo';

/**
 * Continent selection component for the home page
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether this screen is active
 * @param {Function} props.onContinentSelect - Function to call when a continent is selected
 */
const ContinentSelector = ({ isActive, onContinentSelect }) => {
  return (
    <div className={`continent-container ${isActive ? 'active' : ''}`}>
      <Logo showTagline={true} />
      <h2 className="section-title">Select Your Continent</h2>
      <div className="continent-grid">
        {CONTINENTS.map((continent) => (
          <div
            key={continent.id}
            className="continent-item"
            onClick={() => onContinentSelect(continent)}
          >
            <div className={`continent-inner bg-gradient-to-br ${continent.colors}`}>
              <div className="continent-icon"><img className="continent-img" src={continent.icon}></img></div>
              <div className="continent-name">{continent.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ContinentSelector.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onContinentSelect: PropTypes.func.isRequired
};

export default ContinentSelector;