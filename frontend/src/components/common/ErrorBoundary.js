import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import '../../styles/components/ErrorBoundary.css';

/**
 * Error boundary component to catch JavaScript errors in its child component tree
 * Displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also log to an error tracking service here:
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h2>Something went wrong</h2>
            <p>We're sorry, but an error occurred while displaying this content.</p>
            
            {this.props.showDetails && this.state.error && (
              <details className="error-details">
                <summary>Error details</summary>
                <div className="error-message">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <div className="stack-trace">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </details>
            )}
            
            <div className="error-actions">
              <Button 
                onClick={this.resetError}
                variant="primary"
              >
                Try Again
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  showDetails: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  showDetails: false
};

export default ErrorBoundary;