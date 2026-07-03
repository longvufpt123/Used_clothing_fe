import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { User, Leaf, Sun, Moon, LayoutDashboard } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import './Header.css';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? ' nav-link-active' : ''}`;

  return (
    <header className="header glass">
      <div className="container header-container">
        <Link to="/" className="logo">
          <Leaf className="logo-icon text-gradient" />
          <span>Re<span className="logo-highlight">Threads</span></span>
        </Link>

        <nav className="nav-menu">
          <NavLink to="/" end className={navLinkClass}>Trang chủ</NavLink>
          <NavLink to="/products" className={navLinkClass}>Quyên góp & Tiếp nhận</NavLink>
          <NavLink to="/admin" className={navLinkClass}>Báo cáo & Thống kê</NavLink>
        </nav>

        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <Link to="/admin" className="action-link" title="Bảng quản lý (Admin)">
            <LayoutDashboard size={20} />
          </Link>

          <Link to="/login" className="action-link" title="Đăng nhập">
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
};
export default Header;
