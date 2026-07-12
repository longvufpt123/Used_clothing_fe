import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import './StaffOpsLayout.css';

interface StaffOpsLayoutProps {
  children: React.ReactNode;
  homePath: string;
  roleLabel: string;
  brandSuffix?: string;
}

export const StaffOpsLayout: React.FC<StaffOpsLayoutProps> = ({
  children,
  homePath,
  roleLabel,
  brandSuffix = 'Staff',
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="staff-ops-layout">
      <header className="staff-ops-header glass">
        <div className="staff-ops-header-inner">
          <div
            className="staff-ops-brand"
            onClick={() => navigate(homePath)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(homePath)}
          >
            <span className="staff-ops-logo text-gradient">
              <Sparkles size={20} />
            </span>
            <div className="staff-ops-brand-text">
              <span className="staff-ops-logo-text text-gradient">GreenThread {brandSuffix}</span>
              <span className="staff-ops-role-chip">{roleLabel}</span>
            </div>
          </div>

          <div className="staff-ops-header-right">
            <div className="staff-ops-user">
              <div className="staff-ops-avatar">
                <User size={16} />
              </div>
              <span className="staff-ops-user-name">{user?.fullName || roleLabel}</span>
            </div>

            <button
              type="button"
              className="staff-ops-logout"
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="staff-ops-main">{children}</main>
    </div>
  );
};

export default StaffOpsLayout;
