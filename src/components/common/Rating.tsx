import React from 'react';
import { Star } from 'lucide-react';
import './Rating.css';

interface RatingProps {
  value: number; // 0 to 5
  max?: number;
  size?: number;
  onChange?: (value: number) => void;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  size = 18,
  onChange,
}) => {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="rating-container">
      {stars.map((star) => {
        const isFilled = star <= value;
        return (
          <button
            key={star}
            type="button"
            className={`star-btn ${onChange ? 'interactive' : ''}`}
            onClick={() => onChange && onChange(star)}
            disabled={!onChange}
          >
            <Star
              size={size}
              className={isFilled ? 'star-filled' : 'star-empty'}
              fill={isFilled ? 'var(--color-accent)' : 'transparent'}
            />
          </button>
        );
      })}
    </div>
  );
};
export default Rating;
