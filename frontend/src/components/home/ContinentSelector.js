import React from 'react';
import PropTypes from 'prop-types';
import { CONTINENTS } from '../../constants/continents';
import Logo from '../common/Logo';
import '../../styles/components/ContinentSelector.css';

/**
 * Continent selection component for the home page
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
            role="button"
            tabIndex={isActive ? 0 : -1}
            aria-label={`Select ${continent.name}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onContinentSelect(continent);
              }
            }}
          >
            <div className={`continent-inner bg-gradient-to-br ${continent.colors}`}>
              <div className="continent-icon" aria-hidden="true">{continent.icon}</div>
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