import React from 'react';
import './Slider.css';

interface SliderProps {
  label?: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
}) => {
  return (
    <div className="slider-wrapper">
      {label && (
        <div className="slider-header">
          <span className="slider-label">{label}</span>
          <span className="slider-value">{value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="custom-slider"
      />
    </div>
  );
};
export default Slider;
