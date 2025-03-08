import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import StreamingInfo from '../streaming/StreamingInfo';
import Loader from '../common/Loader';
import { getImageUrl } from '../../utils/helpers';
import ApiService from '../../services/api';

/**
 * Modal component for displaying series details with data loading
 * 
 * @param {Object} props - Component props
 * @param {Object} props.seriesItem - The selected series data from the grid
 * @param {string} props.country - Country code to fetch availability
 * @param {Array} props.streamingProviders - Selected streaming providers
 * @param {Function} props.onClose - Function to call when the modal is closed
 */
const SeriesModal = ({ seriesItem, country, streamingProviders, onClose }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seriesDetails, setSeriesDetails] = useState(null);

  // When a series is selected, fetch the detailed information
  useEffect(() => {
    const loadSeriesDetails = async () => {
      if (!seriesItem) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch detailed information about the series
        const details = await ApiService.getSeriesDetails(seriesItem._id || seriesItem.id, country);
        setSeriesDetails(details);
      } catch (err) {
        console.error('Error loading series details:', err);
        setError('Failed to load series details. Please try again later.');
        // Use basic info from seriesItem as fallback
        setSeriesDetails(seriesItem);
      } finally {
        setIsLoading(false);
      }
    };

    loadSeriesDetails();
  }, [seriesItem, country]);

  if (!seriesItem) return null;

  // Use fallback to grid item data if detailed data isn't loaded yet
  const series = seriesDetails || seriesItem;

  return (
    <Modal isOpen={!!seriesItem} onClose={onClose}>
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
        {isLoading ? (
          <div className="modal-loading">
            <Loader text="Loading series details..." visible={true} />
          </div>
        ) : error ? (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="modal-section">
              <h3 className="section-title">Overview</h3>
              <p className="modal-plot">{series.plot || series.overview || 'No overview available.'}</p>
            </div>
            
            {(series.genres || series.cast || series.episode_run_time) && (
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
                  
                  {series.cast && series.cast.length > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Cast</span>
                      <span className="detail-value">{series.cast.join(', ')}</span>
                    </div>
                  )}
                  
                  {series.episode_run_time && (
                    <div className="detail-item">
                      <span className="detail-label">Episode Length</span>
                      <span className="detail-value">{series.episode_run_time} min</span>
                    </div>
                  )}

                  {series.first_air_date && (
                    <div className="detail-item">
                      <span className="detail-label">First Aired</span>
                      <span className="detail-value">{new Date(series.first_air_date).toLocaleDateString()}</span>
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
          </>
        )}
      </div>
    </Modal>
  );
};

SeriesModal.propTypes = {
  seriesItem: PropTypes.object,
  country: PropTypes.string,
  streamingProviders: PropTypes.array,
  onClose: PropTypes.func.isRequired
};

export default SeriesModal;