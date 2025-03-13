import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { getImageUrl } from '../../utils/helpers';
import '../../styles/components/GridItem.css';

/**
 * Grid item component for showing a show/movie in search results
 */
const GridItem = memo(({ item, onClick }) => {
  const handleClick = () => {
    onClick(item);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(item);
    }
  };

  return (
    <div 
      className="grid-item" 
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${item.title || 'Movie'}`}
    >
      <div className="image-container">
        <img
          src={getImageUrl(item.poster_path, 'w500')}
          alt={item.title ? `${item.title} poster` : 'Movie poster'}
          className="series-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
          }}
        />
        {item.content_type && (
          <div className="rating-badge">{item.content_type}</div>
        )}
      </div>
      
      <div className="info-container">
        <h2 className="series-title">{item.title || 'Untitled'}</h2>
        <p className="series-year">{item.year || item.release_year}</p>
      </div>
    </div>
  );
});

GridItem.propTypes = {
  item: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

GridItem.displayName = 'GridItem';

export default GridItem;