import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Archive,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  X,
  Tags,
  HandHeart,
  Moon,
  Sun,
  UserRound,
  ClipboardCheck,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import './AdminSidebar.css';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isManager = location.pathname.startsWith('/manager');
  const basePath = isManager ? '/manager' : '/admin';

  const getMenu = (): SidebarItem[] => {
    if (isManager) {
      return [
        { label: 'Bảng tổng quan', path: basePath, icon: <LayoutDashboard size={18} /> },
        { label: 'Ca làm việc', path: `${basePath}/shifts`, icon: <Truck size={18} /> },
        { label: 'Điều phối tiếp nhận', path: `${basePath}/dispatch`, icon: <Users size={18} /> },
        { label: 'Quản lý tài khoản', path: `${basePath}/users`, icon: <Users size={18} /> },
        { label: 'Quản lý kho bãi', path: `${basePath}/inventory`, icon: <Archive size={18} /> },
        {
          label: 'Yêu cầu phân phối',
          path: `${basePath}/distributions`,
          icon: <HandHeart size={18} />,
        },
        { label: 'Danh mục phân loại', path: `${basePath}/categories`, icon: <Tags size={18} /> },
        {
          label: 'Tiêu chí đánh giá',
          path: `${basePath}/condition-criteria`,
          icon: <ClipboardCheck size={18} />,
        },
      ];
    } else {
      return [
        { label: 'Bảng tổng quan', path: basePath, icon: <LayoutDashboard size={18} /> },
        { label: 'Cấu hình hệ thống', path: `${basePath}/campaigns`, icon: <Settings size={18} /> },
      ];
    }
  };

  return (
    <aside
      className={`admin-sidebar glass ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}
    >
      <div className="sidebar-header">
        <span className="project-title-text text-gradient">ReThreads</span>
        <button
          className="toggle-sidebar-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button
          type="button"
          className="admin-mobile-close"
          onClick={onCloseMobile}
          aria-label="Đóng menu quản trị"
        >
          <X size={18} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {getMenu().map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            end={item.path === basePath}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : undefined}
            onClick={onCloseMobile}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="admin-sidebar-tools">
          <NotificationBell />
          <button
            type="button"
            className="admin-sidebar-logout-icon"
            onClick={() => {
              logout();
              onCloseMobile();
              navigate('/login', { replace: true });
            }}
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              navigate(`${basePath}/profile`);
            }}
            title="Trang cá nhân"
          >
            <UserRound size={18} />
          </button>
        </div>
        <button
          type="button"
          className="admin-sidebar-identity"
          onClick={() => {
            onCloseMobile();
            navigate(`${basePath}/profile`);
          }}
          title={user?.fullName || 'Manager'}
        >
          <span>
            {(user?.fullName || 'Manager')
              .split(/\s+/)
              .slice(-2)
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </span>
          <div>
            <strong>{user?.fullName || 'Manager'}</strong>
            <small>{isManager ? 'Điều phối viên' : 'Quản trị viên'}</small>
          </div>
        </button>
      </div>
    </aside>
  );
};
export default AdminSidebar;
