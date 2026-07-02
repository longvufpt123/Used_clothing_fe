import React from 'react';
import { Calendar } from 'lucide-react';
import './DatePicker.css';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `date-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`datepicker-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="datepicker-label">
          {label}
        </label>
      )}
      <div className="datepicker-container">
        <span className="datepicker-icon">
          <Calendar size={18} />
        </span>
        <input
          type="date"
          id={inputId}
          className="custom-datepicker"
          {...props}
        />
      </div>
      {error && <span className="datepicker-error-text">{error}</span>}
    </div>
  );
};
export default DatePicker;
