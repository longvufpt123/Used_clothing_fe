import React from 'react';
import AdminSidebar from '@/shared/components/AdminSidebar';
import './AdminLayout.css';

interface AdminLayoutProps {
  role?: 'admin' | 'manager' | 'staff';
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  role = 'staff',
  children,
}) => {
  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar role={role} />
      <div className="admin-layout-main">
        <header className="admin-layout-header glass">
          <div className="admin-header-content">
            <h3>Workspace Management Panel</h3>
          </div>
        </header>
        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
};
export default AdminLayout;
