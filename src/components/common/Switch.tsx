import React from 'react';
import './Switch.css';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`switch-wrapper ${className}`}>
      <label htmlFor={inputId} className="switch-label">
        <input
          type="checkbox"
          id={inputId}
          className="custom-switch"
          {...props}
        />
        <span className="switch-slider"></span>
        {label && <span className="switch-text">{label}</span>}
      </label>
    </div>
  );
};
export default Switch;
