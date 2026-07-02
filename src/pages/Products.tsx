import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import './Products.css';

const ALL_PRODUCTS = [
  {
    id: 1,
    title: 'Vintage Leather Jacket (1990s)',
    price: '$89.00',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80',
    category: 'Outerwear',
    condition: 'Like New' as const,
  },
  {
    id: 2,
    title: 'Retro Oversized Denim Shirt',
    price: '$34.00',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=80',
    category: 'Shirts',
    condition: 'Brand New' as const,
  },
  {
    id: 3,
    title: 'Corduroy Cargo Pants (Beige)',
    price: '$45.00',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80',
    category: 'Pants',
    condition: 'Good' as const,
  },
  {
    id: 4,
    title: 'Classic Wool Trench Coat',
    price: '$110.00',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=80',
    category: 'Outerwear',
    condition: 'Like New' as const,
  },
  {
    id: 5,
    title: 'Vintage Graphic Tees (Bundle of 3)',
    price: '$28.00',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
    category: 'Shirts',
    condition: 'Fair' as const,
  },
  {
    id: 6,
    title: 'Distressed Slim Fit Jeans',
    price: '$39.00',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=80',
    category: 'Pants',
    condition: 'Good' as const,
  },
];

export const Products: React.FC = () => {
  const [filter, setFilter] = useState('All');

  const filteredProducts = filter === 'All' 
    ? ALL_PRODUCTS 
    : ALL_PRODUCTS.filter(p => p.category === filter);

  return (
    <div className="products-page container">
      <div className="catalog-header">
        <h1 className="text-gradient">Catalog</h1>
        <p>Curated second-hand items restored to premium quality</p>
      </div>

      <div className="filter-row">
        {['All', 'Outerwear', 'Shirts', 'Pants'].map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {filteredProducts.map((prod) => (
          <Card
            key={prod.id}
            title={prod.title}
            price={prod.price}
            image={prod.image}
            category={prod.category}
            condition={prod.condition}
          />
        ))}
      </div>
    </div>
  );
};
export default Products;
