import React from 'react';
import './Checkbox.css';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`checkbox-wrapper ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={inputId} className="checkbox-label">
        <input
          type="checkbox"
          id={inputId}
          className="custom-checkbox"
          {...props}
        />
        <span className="checkbox-checkmark"></span>
        {label && <span className="checkbox-text">{label}</span>}
      </label>
      {error && <span className="checkbox-error-text">{error}</span>}
    </div>
  );
};
export default Checkbox;
