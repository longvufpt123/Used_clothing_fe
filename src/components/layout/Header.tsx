import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useCartStore } from '@/store/useCartStore';
import './Header.css';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <header className="header glass">
      <div className="container header-container">
        <Link to="/" className="logo">
          <Sparkles className="logo-icon" />
          <span>RE<span className="logo-highlight">WEAR</span></span>
        </Link>

        <nav className="nav-menu">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Catalog</Link>
          <Link to="/about" className="nav-link">Eco Impact</Link>
        </nav>

        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link to="/login" className="action-link">
            <User size={20} />
          </Link>
          <div className="cart-trigger" onClick={() => navigate('/products')}>
            <ShoppingBag size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;
