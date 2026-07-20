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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={`admin-layout-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      {isMobileMenuOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Đóng menu quản trị"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className="admin-layout-main">
        <AdminHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
};
export default AdminLayout;
