import React from 'react';
import './AdminHeader.css';

interface AdminHeaderProps {
  title?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title = 'Workspace Management Panel' 
}) => {
  return (
    <header className="admin-layout-header glass">
      <div className="admin-header-content">
        <h3>{title}</h3>
      </div>
    </header>
  );
};

export default AdminHeader;
