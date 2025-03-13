import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/SkipLink.css';

/**
 * Accessibility skip link for keyboard navigation
 */
const SkipLink = ({ targetId, label = 'Skip to main content' }) => {
  return (
    <a href={`#${targetId}`} className="skip-link">
      {label}
    </a>
  );
};

SkipLink.propTypes = {
  targetId: PropTypes.string.isRequired,
  label: PropTypes.string
};

export default SkipLink;