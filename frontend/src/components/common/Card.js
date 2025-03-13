import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/Card.css';

/**
 * Reusable card component for displaying content in a container
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.title - Card title
 * @param {React.ReactNode} props.subtitle - Card subtitle
 * @param {Object} props.image - Image configuration
 * @param {string} props.image.src - Image source URL
 * @param {string} props.image.alt - Image alt text
 * @param {string} props.image.fallback - Fallback image URL
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({ 
  children,
  title,
  subtitle,
  image,
  onClick,
  className = '',
  badge = null,
  ...props
}) => {
  return (
    <div 
      className={`card ${className} ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      {...props}
    >
      {image && (
        <div className="card-image-container">
          <img
            src={image.src}
            alt={image.alt}
            className="card-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = image.fallback || 'https://via.placeholder.com/300x450?text=No+Image';
            }}
          />
          {badge && <div className="card-badge">{badge}</div>}
        </div>
      )}
      <div className="card-content">
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  image: PropTypes.shape({
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    fallback: PropTypes.string,
  }),
  onClick: PropTypes.func,
  className: PropTypes.string,
  badge: PropTypes.node,
};

export default Card;