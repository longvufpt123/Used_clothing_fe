import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import './AdminHeader.css';

interface AdminHeaderProps {
  title?: string;
  onOpenMobileMenu?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'Bảng điều khiển',
  onOpenMobileMenu,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
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

        {/* Custom User Dropdown */}
        <div className="header-control-wrapper" ref={userMenuRef}>
          <div className="header-profile-toggle" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="profile-avatar">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="Avatar" />
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.fullName || 'Trần Văn Hoàng'}</span>
              <span className="profile-role">
                {user?.role === 'Admin' ? 'Quản trị viên' : user?.role === 'Manager' ? 'Điều phối viên' : 'Nhân viên'}
              </span>
            </div>
            <ChevronDown size={14} className={`chevron-icon ${showUserMenu ? 'rotated' : ''}`} />
          </div>

          {showUserMenu && (
            <div className="header-dropdown profile-dropdown glass">
              <div className="dropdown-user-header">
                <span className="user-email">{user?.userName || 'hoang.tv@usedclothing.vn'}</span>
              </div>
              <div className="dropdown-list">
                <button className="dropdown-item-btn" onClick={() => { setShowUserMenu(false); navigate('/admin/profile'); }}>
                  <User size={16} />
                  <span>Trang cá nhân</span>
                </button>
                <button className="dropdown-item-btn" onClick={() => { setShowUserMenu(false); navigate('/admin/settings'); }}>
                  <Settings size={16} />
                  <span>Cài đặt hệ thống</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item-btn text-danger" onClick={() => { setShowUserMenu(false); navigate('/logout'); }}>
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
