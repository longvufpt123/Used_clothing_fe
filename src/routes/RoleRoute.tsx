import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const homeByRole: Record<string, string> = {
  Admin: '/admin',
  ReceivingStaff: '/receiving',
  ClassificationStaff: '/classification',
  WarehouseStaff: '/warehouse',
  Manager: '/manager',
  Donor: '/',
  CharityOrganization: '/login',
  RecyclingOrganization: '/login',
};

interface RoleRouteProps {
  role: string;
  children: ReactNode;
}

export default function RoleRoute({ role, children }: RoleRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const currentRole = user.role.trim();
  if (currentRole !== role) {
    return <Navigate to={homeByRole[currentRole] ?? '/'} replace />;
  }

  return children;
}

export function RoleHomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={homeByRole[user.role.trim()] ?? '/login'} replace />;
}
