import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import StreamingInfo from '../../components/streaming/StreamingInfo';
import { getImageUrl } from '../../utils/helpers';

/**
 * Modal component for displaying series details
 * Fixed version to ensure proper layout and styling
 * 
 * @param {Object} props - Component props
 * @param {Object} props.series - The selected series data
 * @param {Array} props.streamingProviders - Selected streaming providers
 * @param {Function} props.onClose - Function to call when the modal is closed
 */
const SeriesModal = ({ series, streamingProviders, onClose }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  if (!series) return null;

  return (
    <Modal isOpen={!!series} onClose={onClose}>
      <div className="modal-image-container">
        <img
          src={getImageUrl(series.backdrop_path || series.poster_path, 'w1280')}
          alt={series.title || 'Movie backdrop'}
          className={`modal-image ${isImageLoaded ? 'loaded' : 'loading'}`}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/1280x720?text=No+Image+Available';
          }}
        />
        <div className="modal-gradient-overlay"></div>
        <div className="modal-title-banner">
          <h1>{series.title || 'Untitled'}</h1>
          <div className="modal-meta">
            <span className="modal-year">{series.year || 'Unknown year'}</span>
            <span className="separator">•</span>
            <span className="modal-rating">
              ⭐ {series.vote_average || '?'} ({series.vote_count || 0} votes)
            </span>
            {series.number_of_seasons && (
              <>
                <span className="separator">•</span>
                <span className="modal-seasons">
                  {series.number_of_seasons} Season{series.number_of_seasons !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="modal-details">
        <div className="modal-section">
          <h3 className="section-title">Overview</h3>
          <p className="modal-plot">{series.plot || 'No overview available.'}</p>
        </div>
        
        {(series.genres || series.actors || series.episode_run_time) && (
          <div className="modal-section">
            <h3 className="section-title">Details</h3>
            <div className="modal-details-grid">
              {series.genres && series.genres.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Genre</span>
                  <div className="detail-value genre-tags">
                    {series.genres.map((genre, idx) => (
                      <span key={idx} className="genre-tag">{genre}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {series.actors && series.actors.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Cast</span>
                  <span className="detail-value">{series.actors.join(', ')}</span>
                </div>
              )}
              
              {series.episode_run_time && (
                <div className="detail-item">
                  <span className="detail-label">Episode Length</span>
                  <span className="detail-value">{series.episode_run_time} min</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Streaming Information */}
        <div className="modal-section">
          <h3 className="section-title">Where to Watch</h3>
          <StreamingInfo 
            selectedSeries={series} 
            streaming={streamingProviders} 
          />
        </div>
      </div>
    </Modal>
  );
};

SeriesModal.propTypes = {
  series: PropTypes.object,
  streamingProviders: PropTypes.array,
  onClose: PropTypes.func.isRequired
};

export default SeriesModal;