import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, Menu, X, Leaf, Moon, Sun, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import './OpsLayout.css';
import NotificationBell from '@/components/notifications/NotificationBell';

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

const isActive = (
  item: OpsNavItem,
  pathname: string,
  search: string,
  homePath: string
) => {
  const [itemPath, itemQuery = ''] = item.to.split('?');
  const itemParams = new URLSearchParams(itemQuery);
  const currentParams = new URLSearchParams(search);

  if (itemParams.size > 0) {
    return (
      pathname === itemPath &&
      Array.from(itemParams.entries()).every(
        ([key, value]) => currentParams.get(key) === value
      )
    );
  }

  if (item.to === homePath) {
    return pathname === homePath && !currentParams.has('tab');
  }
  if (pathname === itemPath || pathname.startsWith(itemPath + '/')) return true;
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
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ops-sidebar-collapsed') === 'true');
  const toggleCollapsed = () => setCollapsed((value) => {
    const next = !value;
    localStorage.setItem('ops-sidebar-collapsed', String(next));
    return next;
  });

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const profilePath = `${homePath}/profile`;

  const initials = (user?.fullName || roleLabel)
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const renderNav = () =>
    nav.map((item) => {
      const active = isActive(item, location.pathname, location.search, homePath);
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
            title={collapsed ? item.label : undefined}
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
        className={`ops-rail ${drawerOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
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
            <strong>ReThreads</strong>
            <span>{roleLabel}</span>
          </span>
          <button type="button" className="ops-rail-collapse" onClick={(event) => { event.stopPropagation(); toggleCollapsed(); }} title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'} aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="ops-rail-nav">{renderNav()}</nav>

        <div className="ops-rail-footer">
          <div className="ops-rail-tools">
            <NotificationBell />
            <button type="button" className="ops-rail-action" onClick={toggleTheme} title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} aria-label="Chuyển đổi giao diện">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button type="button" className="ops-rail-action" onClick={() => navigate(profilePath)} title="Xem hồ sơ cá nhân" aria-label="Xem hồ sơ cá nhân"><UserRound size={18}/></button>
            <button type="button" className="ops-rail-logout" onClick={handleLogout} title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={18} strokeWidth={2}/></button>
          </div>
          <NotificationBell />
          <button
            type="button"
            className="ops-rail-user"
            onClick={() => navigate(profilePath)}
            title="Xem hồ sơ cá nhân"
          >
            <span className="ops-rail-avatar">{initials || 'RT'}</span>
            <span className="ops-rail-user-text">
              <strong>{user?.fullName || roleLabel}</strong>
              <span>{roleLabel}</span>
            </span>
          </button>
          <button
            type="button"
            className="ops-rail-action"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            aria-label={theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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
            <Leaf size={16} strokeWidth={2.25} /> ReThreads
            <span className="ops-topbar-role">{roleLabel}</span>
          </span>
          <span className="ops-topbar-actions">
            <NotificationBell />
            <button type="button" onClick={() => navigate(profilePath)} aria-label="Hồ sơ cá nhân">
              <UserRound size={18} />
            </button>
            <button type="button" onClick={toggleTheme} aria-label="Chuyển đổi giao diện">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </span>
        </header>

        <main className="ops-shell-content">{children}</main>
      </div>
    </div>
  );
};

export default OpsLayout;
