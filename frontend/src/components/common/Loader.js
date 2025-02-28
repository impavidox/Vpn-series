import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable loading spinner component
 * @param {Object} props - Component props
 * @param {string} props.text - Text to display with the loader
 * @param {boolean} props.visible - Whether the loader is visible
 */
const Loader = ({ text = 'Loading...', visible = true }) => {
  if (!visible) return null;
  
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      {text && <p>{text}</p>}
    </div>
  );
};

Loader.propTypes = {
  text: PropTypes.string,
  visible: PropTypes.bool
};

export default Loader;