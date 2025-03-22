import React from 'react';
import PropTypes from 'prop-types';
import { getImageUrl } from '../../utils/helpers';

/**
 * Grid item component for showing a show/movie in the search results
 * Updated to display "Movie" with orange label and "TV Show" with cyan label
 * 
 * @param {Object} props - Component props
 * @param {Object} props.item - The show/movie data
 * @param {Function} props.onClick - Function to call when the item is clicked
 */
const GridItem = ({ item, onClick }) => {
  const handleClick = () => {
    onClick(item);
  };

  // Determine the badge color based on content type
  const getBadgeClassName = (contentType) => {
    if (!contentType) return "rating-badge";
    
    const type = contentType.toLowerCase();
    if (type === "movie") {
      return "rating-badge movie-badge";
    } else if (type === "tv show" || type === "tv" || type === "show") {
      return "rating-badge tvshow-badge";
    }
    return "rating-badge";
  };

  // Format the content type display text
  const getContentTypeDisplay = (contentType) => {
    if (!contentType) return "?";
    
    const type = contentType.toLowerCase();
    if (type === "movie") {
      return "Movie";
    } else if (type === "tv" || type === "show") {
      return "TV Show";
    } else if (type === "tv show") {
      return "TV Show";
    }
    return contentType;
  };

  return (
    <div className="grid-item" onClick={handleClick}>
      <div className="image-container">
        <img
          src={getImageUrl(item.poster_path, 'w500')}
          alt={item.title || 'Movie poster'}
          className="series-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
          }}
        />
        {item.content_type && (
          <div className={getBadgeClassName(item.content_type)}>
            {getContentTypeDisplay(item.content_type)}
          </div>
        )}
      </div>
      
      <div className="info-container">
        <h2 className="series-title">{item.title || 'Untitled'}</h2>
        <p className="series-year">{item.year || item.release_year}</p>
      </div>
    </div>
  );
};

GridItem.propTypes = {
  item: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
};

export default GridItem;