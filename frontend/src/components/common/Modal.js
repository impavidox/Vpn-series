import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import FocusTrap from 'focus-trap-react';
import '../../styles/components/Modal.css';

/**
 * Accessible modal component
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  closeOnOutsideClick = true,
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before opening modal
      previousFocusRef.current = document.activeElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Add escape key handler
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        // Clean up
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleEscape);
        
        // Restore focus when modal closes
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use createPortal to render at the top level of the DOM
  return createPortal(
    <FocusTrap>
      <div 
        className="modal-overlay"
        onClick={closeOnOutsideClick ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        <div 
          ref={modalRef}
          className={`modal-content ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <span aria-hidden="true">×</span>
          </button>
          
          {title && <h2 id="modal-title" className="modal-title">{title}</h2>}
          {children}
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
  closeOnOutsideClick: PropTypes.bool,
};

export default Modal;