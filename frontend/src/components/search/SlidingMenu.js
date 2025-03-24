import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import COLORS from '../../constants/colorPalette';
import '../../styles/SlidingMenu.css';

/**
 * Sliding menu component that appears from the left side of the screen
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the menu is open
 * @param {Function} props.onClose - Function to call when the menu should close
 * @param {string} props.currentRoute - Current active route
 */
const SlidingMenu = ({ isOpen, onClose, currentRoute }) => {
  const [animateClass, setAnimateClass] = useState('');
  const menuRef = useRef(null);

  // Define menu navigation items with icons
  const menuItems = [
    { 
      path: '/', 
      label: 'Home',
      icon: 'home.svg',
      color: COLORS.YELLOW
    },
    { 
      path: '/search', 
      label: 'Search',
      icon: 'search.svg',
      color: COLORS.BLUE
    },
    { 
      path: '/watchlist', 
      label: 'My Watchlist',
      icon: 'bookmark.svg',
      color: COLORS.GREEN
    },
    { 
      path: '/providers', 
      label: 'Streaming Providers',
      icon: 'play.svg',
      color: COLORS.ORANGE
    },
    { 
      path: '/credits', 
      label: 'Credits',
      icon: 'credits.svg',
      color: COLORS.BLUE
    },
  ];

  useEffect(() => {
    // Add animation class when isOpen changes
    if (isOpen) {
      setAnimateClass('menu-slide-in');
      // Add event listener to detect clicks outside the menu
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      setAnimateClass('menu-slide-out');
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      onClose();
    }
  };

  // Handle menu item click
  const handleMenuItemClick = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay that darkens the background when menu is open */}
      {isOpen && (
        <div 
          className={`menu-overlay ${animateClass === 'menu-slide-in' ? 'overlay-visible' : ''}`}
          onClick={onClose}
        />
      )}
      
      {/* Menu container */}
      <div 
        ref={menuRef}
        className={`sliding-menu ${animateClass}`}
        style={{ display: isOpen || animateClass === 'menu-slide-out' ? 'block' : 'none' }}
      >
        <div className="menu-header">
          <div className="menu-logo">StreamFinder</div>
          <button className="menu-close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="menu-content">
          <ul className="menu-items">
            {menuItems.map((item) => (
              <li 
                key={item.path} 
                className={`menu-item ${currentRoute === item.path ? 'active' : ''}`}
              >
                <Link 
                  to={item.path} 
                  onClick={handleMenuItemClick}
                  style={{ borderLeftColor: currentRoute === item.path ? item.color : 'transparent' }}
                >
                  <div className="menu-item-icon" style={{ backgroundColor: item.color }}>
                    <img src={item.icon} alt="" />
                  </div>
                  <span className="menu-item-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="menu-footer">
          <div className="user-profile">
            <Link to="/profile" onClick={handleMenuItemClick}>
              <div className="menu-item-icon small" style={{ backgroundColor: COLORS.YELLOW }}>
                <img src="user.svg" alt="" />
              </div>
              <span>My Profile</span>
            </Link>
          </div>
          <p className="copyright">© 2025 StreamFinder</p>
        </div>
      </div>
    </>
  );
};

SlidingMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentRoute: PropTypes.string
};

SlidingMenu.defaultProps = {
  currentRoute: '/'
};

export default SlidingMenu;