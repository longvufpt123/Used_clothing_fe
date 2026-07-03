import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Truck, ShieldCheck, Archive, Leaf, LogOut } from 'lucide-react';
import './AdminSidebar.css';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface AdminSidebarProps {
  role: 'admin' | 'manager' | 'staff';
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ role }) => {
  const getMenu = (): SidebarItem[] => {
    return [
      { label: 'Bảng tổng quan', path: '/admin', icon: <LayoutDashboard size={18} /> },
      { label: 'Lịch trình thu gom', path: '/admin/schedule', icon: <Truck size={18} /> },
      { label: 'Phân loại chi tiết', path: '/admin/classification', icon: <ShieldCheck size={18} /> },
      { label: 'Kiểm kho từ thiện', path: '/admin/inventory', icon: <Archive size={18} /> },
      { label: 'Chiến dịch thu gom', path: '/admin/campaigns', icon: <Leaf size={18} /> },
    ];
  };

  return (
    <aside className="admin-sidebar glass">
      <div className="sidebar-header">
        <h2>Back Office</h2>
        <span className="role-badge">{role.toUpperCase()}</span>
      </div>
      <nav className="sidebar-nav">
        {getMenu().map((item, idx) => (
          <Link key={idx} to={item.path} className="sidebar-link">
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Link to="/logout" className="sidebar-link logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
};
export default AdminSidebar;
