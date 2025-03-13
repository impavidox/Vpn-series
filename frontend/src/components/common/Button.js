import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/Button.css';

/**
 * Reusable button component with multiple variants
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary'|'secondary'|'outline'|'text'} [props.variant='primary'] - Button style variant
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Button size
 * @param {boolean} [props.isFullWidth=false] - Whether button should take full width
 * @param {boolean} [props.isDisabled=false] - Whether button is disabled
 * @param {Function} [props.onClick] - Click handler
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Button type attribute
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {React.ReactNode} [props.icon=null] - Optional icon
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  isFullWidth = false,
  isDisabled = false,
  onClick,
  type = 'button',
  className = '',
  icon = null,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const widthClass = isFullWidth ? 'btn-full-width' : '';
  
  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      <span className="btn-text">{children}</span>
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  isFullWidth: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  icon: PropTypes.node,
};

export default Button;