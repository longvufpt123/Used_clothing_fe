import React, { useId, useRef } from 'react';
import { CalendarDays } from 'lucide-react';
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
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const hasDatePicker = props.type === 'date' || props.type === 'datetime-local';

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
          ref={inputRef}
          id={inputId}
          className={`custom-input ${icon ? 'has-icon-left' : ''} ${hasDatePicker ? 'has-date-icon' : ''}`}
          {...props}
        />
        {hasDatePicker && (
          <button
            type="button"
            className="input-date-icon"
            aria-label="Mở lịch chọn ngày"
            tabIndex={-1}
            onClick={() => inputRef.current?.showPicker?.()}
          >
            <CalendarDays size={17} />
          </button>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {!error && helperText && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
};
export default Input;
