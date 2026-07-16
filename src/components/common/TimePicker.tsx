import React from 'react';
import { Clock } from 'lucide-react';
import './TimePicker.css';

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `time-${Math.random().toString(36).substr(2, 9)}`;

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
    <div className={`timepicker-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="timepicker-label">
          {renderLabel(label)}
        </label>
      )}
      <div className="timepicker-container">
        <span className="timepicker-icon">
          <Clock size={18} />
        </span>
        <input
          type="time"
          id={inputId}
          className="custom-timepicker"
          {...props}
        />
      </div>
      {error && <span className="timepicker-error-text">{error}</span>}
    </div>
  );
};
export default TimePicker;
