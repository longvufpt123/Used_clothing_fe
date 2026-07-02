import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import './Home.css';

// Mock images of clothing items
const MOCK_PRODUCTS = [
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
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-tag">Premium Vintage & Second-Hand</span>
            <h1 className="hero-title">
              Wear the Future, <br />
              <span className="text-gradient">Cherish the Past.</span>
            </h1>
            <p className="hero-subtitle">
              Discover unique pre-loved garments curated for durability, sanitized for hygiene, and selected for style.
            </p>
            <div className="hero-actions-row">
              <Button size="lg" onClick={() => navigate('/products')}>
                Explore Shop <ArrowRight size={18} />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/about')}>
                Our Mission
              </Button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-glow"></div>
            <img
              src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80"
              alt="Sustainable Fashion"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="features container">
        <div className="feature-card glass">
          <Leaf className="feature-icon text-gradient" />
          <h3>100% Eco-Friendly</h3>
          <p>Every purchase offsets textile waste and carbon emissions.</p>
        </div>
        <div className="feature-card glass">
          <ShieldCheck className="feature-icon text-gradient" />
          <h3>Sanitized & Certified</h3>
          <p>Strict cleaning standards ensuring every product feels like new.</p>
        </div>
        <div className="feature-card glass">
          <Heart className="feature-icon text-gradient" />
          <h3>Unique Curation</h3>
          <p>Carefully handpicked items to make your wardrobe truly unique.</p>
        </div>
      </section>

      {/* Featured Items */}
      <section className="featured container">
        <div className="section-header">
          <h2>Trending Finds</h2>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            View All Catalog <ArrowRight size={16} />
          </Button>
        </div>
        <div className="product-grid">
          {MOCK_PRODUCTS.map((prod) => (
            <Card
              key={prod.id}
              title={prod.title}
              price={prod.price}
              image={prod.image}
              category={prod.category}
              condition={prod.condition}
              onClick={() => navigate('/products')}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
export default Home;
