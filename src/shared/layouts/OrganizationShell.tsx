import type React from 'react';
import { ClipboardList, HeartHandshake, ShoppingBag } from 'lucide-react';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';

export default function OrganizationShell({ children }: { children: React.ReactNode }) {
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
    <OpsLayout homePath="/organization/distributions" roleLabel="Tổ chức từ thiện" nav={nav}>
      {children}
    </OpsLayout>
  );
}
