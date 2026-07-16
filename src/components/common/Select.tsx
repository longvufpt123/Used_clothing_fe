import React from 'react';
import './Select.css';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

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
    <div className={`select-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {renderLabel(label)}
        </label>
      )}
      <div className="select-container">
        <select id={selectId} className="custom-select" {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="select-option">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="select-arrow"></span>
      </div>
      {error && <span className="select-error-text">{error}</span>}
    </div>
  );
};
export default Select;
