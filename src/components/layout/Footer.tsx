import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <h3>REWEAR</h3>
          <p>Give second-hand clothing a second life. Premium vintage and curated streetwear, sanitized and certified sustainable.</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/products">Men</a></li>
              <li><a href="/products">Women</a></li>
              <li><a href="/products">Accessories</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Sustainability</h4>
            <ul>
              <li><a href="/about">Eco Score</a></li>
              <li><a href="/about">Process</a></li>
              <li><a href="/about">FAQ</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p>&copy; {new Date().getFullYear()} REWEAR. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
