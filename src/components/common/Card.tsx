import React from 'react';
import './Card.css';

interface CardProps {
  title: string;
  price: string;
  image: string;
  category?: string;
  condition?: 'Brand New' | 'Like New' | 'Good' | 'Fair';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  price,
  image,
  category,
  condition,
  onClick,
}) => {
  return (
    <div className="custom-card card-hover" onClick={onClick}>
      <div className="card-image-wrapper">
        <img src={image} alt={title} className="card-image" loading="lazy" />
        {condition && (
          <span className={`badge badge-${condition.toLowerCase().replace(' ', '-')}`}>
            {condition}
          </span>
        )}
      </div>
      <div className="card-content">
        {category && <span className="card-category">{category}</span>}
        <h3 className="card-title">{title}</h3>
        <div className="card-footer">
          <span className="card-price">{price}</span>
          <button className="card-action-btn">View Details</button>
        </div>
      </div>
    </div>
  );
};
export default Card;
