import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/FeatureBox.css';

/**
 * Feature box for the welcome screen
 */
const FeatureBox = ({ icon, iconColor, title, description }) => {
  return (
    <div className="feature-box">
      <div className={`feature-icon ${iconColor}`} aria-hidden="true">{icon}</div>
      <div className="feature-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

FeatureBox.propTypes = {
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};

export default FeatureBox;