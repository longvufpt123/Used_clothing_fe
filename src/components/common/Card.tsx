import React from 'react';
import './Card.css';

type ProductCondition = 'Mới nguyên' | 'Như mới' | 'Tốt' | 'Khá';

const CONDITION_CLASS_NAMES: Record<ProductCondition, string> = {
  'Mới nguyên': 'brand-new',
  'Như mới': 'like-new',
  'Tốt': 'good',
  'Khá': 'fair',
};

interface CardProps {
  title: string;
  price: string;
  image: string;
  category?: string;
  condition?: ProductCondition;
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
<span className={`badge badge-${CONDITION_CLASS_NAMES[condition]}`}>
             {condition}
           </span>
        )}
      </div>
      <div className="card-content">
        {category && <span className="card-category">{category}</span>}
        <h3 className="card-title">{title}</h3>
        <div className="card-footer">
          <span className="card-price">{price}</span>
          <button className="card-action-btn">Xem chi tiết</button>
        </div>
      </div>
    </div>
  );
};
export default Card;
