import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, CircleUserRound, ClipboardList, LayoutDashboard, Leaf, LogOut, Moon, Sun, User } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import './Header.css';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeUserMenu();
    navigate('/');
  };

  return (
    <header className="header glass">
      <div className="container header-container">
        <Link to="/" className="logo">
          <Leaf className="logo-icon text-gradient" />
          <span>Re<span className="logo-highlight">Threads</span></span>
        </Link>

        <nav className="nav-menu">
          <Link to="/" className="nav-link">Trang chủ</Link>
          <Link to="/products" className="nav-link">Quyên góp</Link>
          <Link to="/map" className="nav-link">Điểm thu gom</Link>
          <Link to="/leaderboard" className="nav-link">Bảng vàng</Link>
          <Link to="/admin" className="nav-link">Quản trị</Link>
        </nav>

        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <Link to="/admin" className="action-link" title="Bảng quản lý (Admin)">
            <LayoutDashboard size={20} />
          </Link>

          {isAuthenticated ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="action-link user-menu-trigger"
                title="Tài khoản"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen(prev => !prev)}
              >
                {user?.avatarUrl ? (
                  <img className="user-avatar" src={user.avatarUrl} alt={user.fullName || user.userName} />
                ) : (
                  <User size={20} />
                )}
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown glass" role="menu">
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-name">{user?.fullName || user?.userName || 'Tài khoản'}</span>
                    <span className="user-dropdown-role">{user?.role}</span>
                  </div>

                  <Link to="/account" className="user-dropdown-item" role="menuitem" onClick={closeUserMenu}>
                    <CircleUserRound size={17} />
                    <span>Tài khoản</span>
                  </Link>
                  <Link to="/my-orders" className="user-dropdown-item" role="menuitem" onClick={closeUserMenu}>
                    <ClipboardList size={17} />
                    <span>Đơn của tôi</span>
                  </Link>
                  <Link to="/leaderboard" className="user-dropdown-item" role="menuitem" onClick={closeUserMenu}>
                    <Award size={17} />
                    <span>Điểm số quyên góp</span>
                  </Link>
                  <button type="button" className="user-dropdown-item logout-menu-item" role="menuitem" onClick={handleLogout}>
                    <LogOut size={17} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="action-link" title="Đăng nhập">
              <User size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;