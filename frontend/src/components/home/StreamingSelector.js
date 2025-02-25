import React from 'react';
import PropTypes from 'prop-types';
import { STREAMING_OPTIONS } from '../../constants/streamingOptions';

/**
 * Streaming service selection component for the home page
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether this screen is active
 * @param {Array} props.selectedStreaming - Array of selected streaming services
 * @param {Function} props.onStreamingSelect - Function to call when a streaming service is selected
 * @param {Function} props.onBack - Function to call when the back button is clicked
 * @param {Function} props.onExplore - Function to call when the explore button is clicked
 */
const StreamingSelector = ({
  isActive,
  selectedStreaming,
  onStreamingSelect,
  onBack,
  onExplore
}) => {
  return (
    <div className={`streaming-container ${isActive ? 'active' : ''}`}>
      <h2 className="section-title">Select Your Streaming Provider(s)</h2>
      <div className="streaming-grid">
        {STREAMING_OPTIONS.map((streaming) => (
          <div
            key={streaming.value}
            className={`streaming-item ${selectedStreaming.includes(streaming.value) ? 'selected' : ''}`}
            onClick={() => onStreamingSelect(streaming.value)}
          >
            <div className="streaming-icon">{streaming.icon}</div>
            <div className="streaming-name">{streaming.label}</div>
          </div>
        ))}
      </div>
      <p className="streaming-hint">
        Select all the streaming services you currently subscribe to.
      </p>
      <div className="button-container">
        <button onClick={onBack} className="back-button">Back</button>
        <button
          onClick={onExplore}
          className="explore-button"
          disabled={selectedStreaming.length === 0}
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
};

StreamingSelector.propTypes = {
  isActive: PropTypes.bool.isRequired,
  selectedStreaming: PropTypes.array.isRequired,
  onStreamingSelect: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onExplore: PropTypes.func.isRequired
};

export default StreamingSelector;