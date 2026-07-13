import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Leaf } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import './OpsLayout.css';

export interface OpsNavItem {
  /** Route this item links to */
  to: string;
  label: string;
  icon: LucideIcon;
  /** Live count shown as a chip; 0 or undefined hides the chip */
  count?: number;
  /** Extra path prefixes that should also mark this item active */
  matchPrefixes?: string[];
  /** Render a subtle divider label above this item */
  groupLabel?: string;
}

interface OpsLayoutProps {
  children: React.ReactNode;
  /** Route the brand/logo returns to (the role dashboard) */
  homePath: string;
  /** Short role name shown under the brand, e.g. "Kho" */
  roleLabel: string;
  /** Full workflow navigation for this role */
  nav: OpsNavItem[];
}

const isActive = (item: OpsNavItem, pathname: string, homePath: string) => {
  if (item.to === homePath) return pathname === homePath;
  if (pathname === item.to || pathname.startsWith(item.to + '/')) return true;
  return (item.matchPrefixes || []).some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
};

export const OpsLayout: React.FC<OpsLayoutProps> = ({
  children,
  homePath,
  roleLabel,
  nav,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.fullName || roleLabel)
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const renderNav = () =>
    nav.map((item) => {
      const active = isActive(item, location.pathname, homePath);
      const Icon = item.icon;
      return (
        <React.Fragment key={item.to}>
          {item.groupLabel && (
            <span className="ops-rail-group">{item.groupLabel}</span>
          )}
          <button
            type="button"
            className={`ops-rail-link ${active ? 'active' : ''}`}
            onClick={() => navigate(item.to)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="ops-rail-link-icon">
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className="ops-rail-link-label">{item.label}</span>
            {item.count ? (
              <span className="ops-rail-count">{item.count}</span>
            ) : null}
          </button>
        </React.Fragment>
      );
    });

  return (
    <div className="ops-shell">
      {/* Fixed workflow rail (desktop) + slide-in drawer (mobile) */}
      <aside
        className={`ops-rail ${drawerOpen ? 'open' : ''}`}
        aria-label="Điều hướng quy trình"
      >
        <div
          className="ops-rail-brand"
          role="button"
          tabIndex={0}
          onClick={() => navigate(homePath)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(homePath)}
        >
          <span className="ops-rail-mark">
            <Leaf size={20} strokeWidth={2.25} />
          </span>
          <span className="ops-rail-brand-text">
            <strong>GreenThread</strong>
            <span>{roleLabel}</span>
          </span>
        </div>

        <nav className="ops-rail-nav">{renderNav()}</nav>

        <div className="ops-rail-footer">
          <div className="ops-rail-user">
            <span className="ops-rail-avatar">{initials || 'GT'}</span>
            <span className="ops-rail-user-text">
              <strong>{user?.fullName || roleLabel}</strong>
              <span>{user?.userName ? '@' + user.userName : roleLabel}</span>
            </span>
          </div>
          <button
            type="button"
            className="ops-rail-logout"
            onClick={handleLogout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* Dim backdrop behind the mobile drawer */}
      {drawerOpen && (
        <button
          type="button"
          className="ops-rail-backdrop"
          aria-label="Đóng menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className="ops-shell-main">
        {/* Compact top bar — only visible on mobile to toggle the rail */}
        <header className="ops-topbar">
          <button
            type="button"
            className="ops-topbar-menu"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label={drawerOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="ops-topbar-brand">
            <Leaf size={16} strokeWidth={2.25} /> GreenThread
            <span className="ops-topbar-role">{roleLabel}</span>
          </span>
        </header>

        <main className="ops-shell-content">{children}</main>
      </div>
    </div>
  );
};

export default OpsLayout;
