import React from 'react';
import PropTypes from 'prop-types';

/**
 * Feature box component for the home page
 * 
 * @param {Object} props - Component props
 * @param {string} props.icon - Emoji icon to display
 * @param {string} props.iconColor - Color class for the icon
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 */
const FeatureBox = ({ icon, iconColor, title, description }) => {
  return (
    <div className="feature-box">
      <div className={`feature-icon ${iconColor}`}>{icon}</div>
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