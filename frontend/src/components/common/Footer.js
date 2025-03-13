import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/Footer.css';

/**
 * Footer component to display at the bottom of pages
 */
const Footer = ({ text = '© 2025 BeyondVPN | Not affiliated with any streaming service' }) => {
  return (
    <footer className="footer">
      <p>{text}</p>
    </footer>
  );
};

Footer.propTypes = {
  text: PropTypes.string
};

export default Footer;