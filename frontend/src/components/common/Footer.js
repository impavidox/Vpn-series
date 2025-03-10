import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/Footer.css';

/**
 * Reusable footer component
 * @param {Object} props - Component props
 * @param {string} props.text - Footer text
 */
const Footer = ({ text = '© 2025 BeyondFlix | Not affiliated with any streaming service' }) => {
  return (
    <div className="footer">
      <p>{text}</p>
    </div>
  );
};

Footer.propTypes = {
  text: PropTypes.string
};

export default Footer;