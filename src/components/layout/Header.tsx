import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Leaf, Moon, Sun, User, LogIn } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import './Header.css';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="header glass">
      <div className="container header-container">
        <Link to="/" className="logo">
          <Leaf className="logo-icon text-gradient" />
          <span>Re<span className="logo-highlight">Threads</span></span>
        </Link>

        <nav className="nav-menu">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>Trang chủ</NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>Quyên góp</NavLink>
          <NavLink to="/map" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>Điểm thu gom</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>Bảng vàng</NavLink>
        </nav>

        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <Link to="/profile" className="action-link user-menu-trigger" title="Hồ sơ cá nhân">
              {user?.avatarUrl ? (
                <img className="user-avatar" src={user.avatarUrl} alt={user.fullName || user.userName} />
              ) : (
                <User size={20} />
              )}
            </Link>
          ) : (
            <Link to="/login" className="action-link login-link-btn" title="Đăng nhập">
              <LogIn size={18} />
              <span className="login-text">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;