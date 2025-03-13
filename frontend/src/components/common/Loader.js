import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/Loader.css';

/**
 * Loading spinner component
 */
const Loader = ({ 
  text = 'Loading...', 
  visible = true, 
  size = 'medium', 
  fullPage = false 
}) => {
  if (!visible) return null;
  
  const sizeClass = `loader-${size}`;
  const containerClass = fullPage ? 'loader-fullpage' : 'loader-container';
  
  return (
    <div className={containerClass} aria-busy="true" role="status">
      <div className={`loader-spinner ${sizeClass}`} aria-hidden="true"></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

Loader.propTypes = {
  text: PropTypes.string,
  visible: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullPage: PropTypes.bool,
};

export default Loader;