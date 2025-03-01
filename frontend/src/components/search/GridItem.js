import React from 'react';
import PropTypes from 'prop-types';
import { getImageUrl } from '../../utils/helpers';

/**
 * Grid item component for showing a show/movie in the search results
 * Fixed version to ensure proper styling and layout
 * 
 * @param {Object} props - Component props
 * @param {Object} props.item - The show/movie data
 * @param {Function} props.onClick - Function to call when the item is clicked
 */
const GridItem = ({ item, onClick }) => {
  const handleClick = () => {
    onClick(item);
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
        {item.vote_average && (
          <div className="rating-badge">{item.vote_average.toFixed(1) || '?'}</div>
        )}
        
        {/* Hover content with scrollbar */}
        <div className="item-hover-content">
          <div className="hover-genres">
            {item.genres && item.genres.length > 0 ? (
              item.genres.slice(0, 2).map((genre, idx) => (
                <span key={idx} className="hover-genre-tag">{genre}</span>
              ))
            ) : (
              <span className="hover-genre-tag">Unknown Genre</span>
            )}
          </div>
          {/* <div className="hover-overview">
            {item.plot ? (
              <>
                {item.plot}
              </>
            ) : (
              'No overview available.'
            )}
          </div> */}
        </div>
      </div>
      
      <div className="info-container">
        <h2 className="series-title">{item.title || 'Untitled'}</h2>
        <p className="series-year">{item.year || 'Unknown year'}</p>
      </div>
    </div>
  );
};

GridItem.propTypes = {
  item: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
};

export default GridItem;