import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/Input.css';

/**
 * Input component with label and error handling
 */
const Input = forwardRef(({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  className = '',
  error,
  label,
  icon,
  ...props
}, ref) => {
  const inputId = id || name;
  const hasError = !!error;

  return (
    <div className={`input-group ${hasError ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      
      <div className={`input-wrapper ${icon ? 'has-icon' : ''}`}>
        {icon && <span className="input-icon" aria-hidden="true">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input-field"
          aria-invalid={hasError}
          {...props}
        />
      </div>
      
      {error && (
        <div className="input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.string,
  label: PropTypes.string,
  icon: PropTypes.node,
};

export default Input;