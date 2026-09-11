import type React from 'react';
import { ClipboardList, HeartHandshake, ShoppingBag } from 'lucide-react';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';
import { useAuth } from '@/context/AuthContext';

export default function OrganizationShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const processing = ['RecyclingOrganization', 'DisposalOrganization'].includes(user?.role.trim() || '');
  const nav: OpsNavItem[] = [
    {
      to: '/organization/distributions',
      label: 'Kho đồ từ thiện',
      icon: ShoppingBag,
      groupLabel: 'Phân phối',
    },
    {
      to: '/organization/distributions?tab=requests',
      label: 'Yêu cầu của tôi',
      icon: ClipboardList,
    },
    {
      to: '/organization/distributions?tab=tracking',
      label: 'Theo dõi giao hàng',
      icon: HeartHandshake,
    },
  ];
  return (
    <OpsLayout homePath={processing ? '/organization/processing-operations' : '/organization/distributions'}
      roleLabel={processing ? user?.role.trim() === 'RecyclingOrganization' ? 'Tổ chức tái chế' : 'Tổ chức tiêu hủy' : 'Tổ chức từ thiện'}
      nav={processing ? [{ to: '/organization/processing-operations', label: 'Yêu cầu xử lý', icon: ClipboardList, matchPrefixes: ['/organization/processing-operations'] }] : nav}>
      {children}
    </OpsLayout>
  );
}
