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
        <img 
          src="/logo.svg" 
          alt="BeyondVPN Logo" 
          className="logo-image"
          onError={(e) => {
            e.target.onerror = null;
            // Fallback to text logo if SVG fails to load
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `
              <span class="logo-part-1">Beyond</span>
              <span class="logo-part-2">VPN</span>
              <span class="logo-emoji">🌍</span>
            `;
          }}
        />
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