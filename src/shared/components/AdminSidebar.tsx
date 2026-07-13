import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Truck, Archive, Leaf, LogOut, ChevronLeft, ChevronRight, Users, Settings } from 'lucide-react';
import './AdminSidebar.css';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const isManager = location.pathname.startsWith('/manager');
  const basePath = isManager ? '/manager' : '/admin';

  const getMenu = (): SidebarItem[] => {
    if (isManager) {
      return [
        { label: 'Bảng tổng quan', path: basePath, icon: <LayoutDashboard size={18} /> },
        { label: 'Cấu hình ca làm việc', path: `${basePath}/schedule`, icon: <Truck size={18} /> },
        { label: 'Quản lý tài khoản', path: `${basePath}/users`, icon: <Users size={18} /> },
        { label: 'Quản lý kho bãi', path: `${basePath}/inventory`, icon: <Archive size={18} /> },
        { label: 'Kế hoạch lịch trình AI', path: `${basePath}/campaigns`, icon: <Leaf size={18} /> },
      ];
    } else {
      return [
        { label: 'Bảng tổng quan', path: basePath, icon: <LayoutDashboard size={18} /> },
        { label: 'Cấu hình hệ thống', path: `${basePath}/campaigns`, icon: <Settings size={18} /> },
      ];
    }
  };

  return (
    <aside className={`admin-sidebar glass ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <span className="project-title-text text-gradient">GreenThread</span>
        )}
        <button className="toggle-sidebar-btn" onClick={onToggleCollapse} title={isCollapsed ? "Mở rộng" : "Thu gọn"}>
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/logout" className="sidebar-link logout-btn" title={isCollapsed ? "Đăng xuất" : undefined}>
          <LogOut size={18} />
          {!isCollapsed && <span>Đăng xuất</span>}
        </NavLink>
      </div>
    </aside>
  );
};
export default AdminSidebar;
