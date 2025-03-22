import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import StreamingInfo from '../../components/streaming/StreamingInfo';
import { getImageUrl } from '../../utils/helpers';

/**
 * Modal component for displaying series details
 * Updated to handle loading states for progressive loading
 * 
 * @param {Object} props - Component props
 * @param {Object} props.series - The selected series data
 * @param {Array} props.streamingProviders - Selected streaming providers
 * @param {boolean} props.isLoadingDetails - Whether detailed data is being loaded
 * @param {Function} props.onClose - Function to call when the modal is closed
 */
const SeriesModal = ({ series, streamingProviders, isLoadingDetails, onClose }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Reset image loaded state when series changes
  useEffect(() => {
    setIsImageLoaded(false);
  }, [series]);

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
            <span className="modal-year">{series.year || series.release_year}</span>
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
        {/* Overview Section */}
        <div className="modal-section">
          <h3 className="section-title">Overview</h3>
          {isLoadingDetails && !series.plot ? (
            <div className="loading-placeholder">
              <div className="loading-pulse"></div>
              <div className="loading-pulse"></div>
              <div className="loading-pulse"></div>
            </div>
          ) : (
            <p className="modal-plot">{series.plot || 'No overview available.'}</p>
          )}
        </div>
        
        {/* Details Section - Only show if we have at least one of these properties */}
        {/* or if we're still loading details */}
        {(isLoadingDetails || series.genres || series.actors || series.episode_run_time) && (
          <div className="modal-section">
            <h3 className="section-title">Details</h3>
            <div className="modal-details-grid">
              {/* Genres - Show placeholder if loading and no genres data yet */}
              {isLoadingDetails && !series.genres ? (
                <div className="detail-item">
                  <span className="detail-label">Genre</span>
                  <div className="detail-value genre-tags">
                    <div className="loading-genre-tags">
                      <span className="loading-genre-tag"></span>
                      <span className="loading-genre-tag"></span>
                      <span className="loading-genre-tag"></span>
                    </div>
                  </div>
                </div>
              ) : series.genres && series.genres.length > 0 ? (
                <div className="detail-item">
                  <span className="detail-label">Genre</span>
                  <div className="detail-value genre-tags">
                    {series.genres.map((genre, idx) => (
                      <span key={idx} className="genre-tag">{genre}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              
              {/* Cast - Show placeholder if loading and no actors data yet */}
              {isLoadingDetails && !series.actors ? (
                <div className="detail-item">
                  <span className="detail-label">Cast</span>
                  <div className="loading-placeholder">
                    <div className="loading-pulse shorter"></div>
                  </div>
                </div>
              ) : series.actors && series.actors.length > 0 ? (
                <div className="detail-item">
                  <span className="detail-label">Cast</span>
                  <span className="detail-value">{series.actors.join(', ')}</span>
                </div>
              ) : null}
              
              {/* Episode Length - Show placeholder if loading and no episode_run_time data yet */}
              {isLoadingDetails && !series.episode_run_time ? (
                <div className="detail-item">
                  <span className="detail-label">Episode Length</span>
                  <div className="loading-placeholder">
                    <div className="loading-pulse shorter"></div>
                  </div>
                </div>
              ) : series.episode_run_time ? (
                <div className="detail-item">
                  <span className="detail-label">Episode Length</span>
                  <span className="detail-value">{series.episode_run_time} min</span>
                </div>
              ) : null}
            </div>
          </div>
        )}
        
        {/* Streaming Information Section */}
        <div className="modal-section">
          <h3 className="section-title">Where to Watch</h3>
          {isLoadingDetails && !series.provider_data ? (
            <div className="loading-streaming-info">
              <div className="loading-country-blocks">
                <div className="loading-country-block"></div>
                <div className="loading-country-block"></div>
              </div>
            </div>
          ) : (
            <StreamingInfo 
              selectedContent={series} 
              streaming={streamingProviders} 
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

SeriesModal.propTypes = {
  series: PropTypes.object,
  streamingProviders: PropTypes.array,
  isLoadingDetails: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

SeriesModal.defaultProps = {
  isLoadingDetails: false
};

export default SeriesModal;