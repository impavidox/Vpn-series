import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../styles/Modal.css';

/**
 * Reusable modal component with fixed close button alignment
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.className - Additional classes for the modal content
 */
const Modal = ({ isOpen, onClose, children, className = '' }) => {
  useEffect(() => {
    // Prevent scrolling on the body when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Cleanup
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Add escape key handling
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
              <button 
          className="close-button" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <img src='x.svg'></img>
        </button>
      <div 
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Modal;