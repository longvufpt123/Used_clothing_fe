import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './AdminHeader.css';

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
  const profilePath = location.pathname.startsWith('/manager') ? '/manager/profile' : '/admin/profile';
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, text: 'Đơn hàng mới tiếp nhận từ kho Quận 7', time: '5 phút trước', read: false },
    { id: 2, text: 'Chiến dịch xanh dệt tái chế đạt mốc 1000kg', time: '1 giờ trước', read: false },
    { id: 3, text: 'Lịch thu gom hôm nay đã được cập nhật', time: '2 giờ trước', read: true }
  ];

  return (
    <header className="admin-layout-header glass">
      <div className="admin-header-left">
        <button type="button" className="admin-mobile-menu-button" onClick={onOpenMobileMenu} aria-label="Mở menu quản trị">
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
        {/* Notifications Icon with Dropdown */}
        <div className="header-control-wrapper" ref={notificationRef}>
          <button 
            className={`header-icon-btn ${showNotifications ? 'active' : ''}`} 
            onClick={() => setShowNotifications(!showNotifications)}
            title="Thông báo"
          >
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>
          
          {showNotifications && (
            <div className="header-dropdown notification-dropdown glass">
              <div className="dropdown-header">
                <h4>Thông báo mới</h4>
                <button className="mark-read-btn">Đọc tất cả</button>
              </div>
              <div className="dropdown-list">
                {notifications.map((noti) => (
                  <div key={noti.id} className={`dropdown-item ${noti.read ? 'read' : 'unread'}`}>
                    <p className="noti-text">{noti.text}</p>
                    <span className="noti-time">{noti.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="header-control-wrapper">
          <button type="button" className="header-profile-toggle admin-profile-button" onClick={() => navigate(profilePath)} title="Xem hồ sơ cá nhân">
            <div className="profile-avatar">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="Ảnh đại diện" />
                : <span className="admin-avatar-fallback">{(user?.fullName || 'Manager').split(/\s+/).slice(-2).map(part=>part[0]).join('').toUpperCase()}</span>}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.fullName || 'Trần Văn Hoàng'}</span>
              <span className="profile-role">
                {user?.role === 'Admin' ? 'Quản trị viên' : user?.role === 'Manager' ? 'Điều phối viên' : 'Nhân viên'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
