import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Logo component
 * @param {Object} props - Component props
 * @param {boolean} props.showTagline - Whether to show the tagline
 * @param {Function} props.onClick - Click handler
 */
const Logo = ({ showTagline = false, onClick }) => {
  return (
    <div className="logo-container" onClick={onClick}>
      <h1 className="logo">
        <span className="logo-part-1">Beyond</span>
        <span className="logo-part-2">Flix</span>
        <span className="logo-emoji">🌍</span>
      </h1>
      {showTagline && <div className="logo-tagline">GO BEYOND BORDERS</div>}
    </div>
  );
};

Logo.propTypes = {
  showTagline: PropTypes.bool,
  onClick: PropTypes.func
};

export default Logo;