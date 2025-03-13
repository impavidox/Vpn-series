import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import '../../styles/components/ErrorMessage.css';

/**
 * Inline error message component
 */
const ErrorMessage = ({ 
  message = 'An error occurred',
  retryAction = null,
  className = '',
  icon = '⚠️'
}) => {
  return (
    <div className={`error-message ${className}`} role="alert">
      <div className="error-icon" aria-hidden="true">{icon}</div>
      <div className="error-content">
        <p>{message}</p>
        {retryAction && (
          <Button 
            onClick={retryAction}
            variant="outline"
            size="small"
            className="error-retry-button"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  retryAction: PropTypes.func,
  className: PropTypes.string,
  icon: PropTypes.node
};

export default ErrorMessage;