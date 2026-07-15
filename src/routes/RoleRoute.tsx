import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const homeByRole: Record<string, string> = {
  ReceivingStaff: '/receiving',
  ClassificationStaff: '/classification',
  WarehouseStaff: '/warehouse',
  Manager: '/manager',
  Donor: '/',
  CharityOrganization: '/',
  RecyclingOrganization: '/',
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

  if (user.role !== role) {
    return <Navigate to={homeByRole[user.role] ?? '/'} replace />;
  }

  return children;
}
