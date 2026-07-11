import React, { useState } from 'react';
import AdminSidebar from '@/shared/components/AdminSidebar';
import AdminHeader from '@/shared/components/AdminHeader';
import './AdminLayout.css';

interface AdminLayoutProps {
  role?: 'admin' | 'manager' | 'staff';
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`admin-layout-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <div className="admin-layout-main">
        <AdminHeader />
        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
};
export default AdminLayout;
