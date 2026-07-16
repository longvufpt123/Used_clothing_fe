import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const renderLabel = (text: string) => {
    if (text.endsWith('*')) {
      return (
        <>
          {text.slice(0, -1)}
          <span className="required-asterisk" style={{ color: 'var(--color-danger, #ef4444)', marginLeft: '2px' }}>*</span>
        </>
      );
    }
    return text;
  };

  return (
    <div className={`input-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {renderLabel(label)}
        </label>
      )}
      <div className="input-container">
        {icon && <span className="input-icon-left">{icon}</span>}
        <input
          id={inputId}
          className={`custom-input ${icon ? 'has-icon-left' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {!error && helperText && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
};
export default Input;
