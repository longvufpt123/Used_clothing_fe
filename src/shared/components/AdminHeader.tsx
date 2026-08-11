import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './AdminHeader.css';
import NotificationBell from '@/components/notifications/NotificationBell';

interface AdminHeaderProps {
  title?: string;
  onOpenMobileMenu?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'Bảng điều khiển',
  onOpenMobileMenu,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const profilePath = location.pathname.startsWith('/manager')
    ? '/manager/profile'
    : '/admin/profile';

  return (
    <header className="admin-layout-header glass">
      <div className="admin-header-left">
        <button
          type="button"
          className="admin-mobile-menu-button"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu quản trị"
        >
          <Menu size={20} />
        </button>
        <h3>{title}</h3>
      </div>

      <div className="admin-header-right">
        <button
          type="button"
          className="header-icon-btn admin-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          aria-label={theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <NotificationBell />

        <div className="header-control-wrapper">
          <button
            type="button"
            className="header-profile-toggle admin-profile-button"
            onClick={() => navigate(profilePath)}
            title="Xem hồ sơ cá nhân"
          >
            <div className="profile-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Ảnh đại diện" />
              ) : (
                <span className="admin-avatar-fallback">
                  {(user?.fullName || 'Manager')
                    .split(/\s+/)
                    .slice(-2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.fullName || 'Trần Văn Hoàng'}</span>
              <span className="profile-role">
                {user?.role === 'Admin'
                  ? 'Quản trị viên'
                  : user?.role === 'Manager'
                    ? 'Điều phối viên'
                    : 'Nhân viên'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
