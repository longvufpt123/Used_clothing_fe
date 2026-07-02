import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, Settings, LogOut } from 'lucide-react';
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
    const baseMenu = [
      { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
      { label: 'Products Management', path: '/admin/products', icon: <ShoppingBag size={18} /> },
    ];

    if (role === 'admin' || role === 'manager') {
      baseMenu.push({ label: 'Staff Management', path: '/admin/staff', icon: <Users size={18} /> });
    }

    if (role === 'admin') {
      baseMenu.push({ label: 'System Settings', path: '/admin/settings', icon: <Settings size={18} /> });
    }

    return baseMenu;
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
