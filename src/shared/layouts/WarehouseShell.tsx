import React, { useEffect, useState } from 'react';
import {
  Archive,
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  PackagePlus,
  HandHeart,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';
import { warehouseService } from '@/services/warehouseService';

export const WarehouseShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [counts, setCounts] = useState({ inbound: 0, putaway: 0, inventory: 0 });
  useEffect(() => {
    let disposed = false;
    let busy = false;
    const refresh = () => {
      if (busy || document.hidden) return;
      busy = true;
      void warehouseService
        .dashboard()
        .then((x) => {
          if (!disposed) setCounts({
            inbound: x.pendingReceipt,
            putaway: x.awaitingPutaway,
            inventory: x.inventorySkuCount,
          });
        })
        .catch(() => {})
        .finally(() => { busy = false; });
    };
    refresh();
    const id = window.setInterval(refresh, 10000);
    document.addEventListener('visibilitychange', refresh);
    return () => { disposed = true; window.clearInterval(id); document.removeEventListener('visibilitychange', refresh); };
  }, [location.pathname]);
  const nav: OpsNavItem[] = [
    { to: '/warehouse', label: 'Tổng quan', icon: LayoutDashboard },
    {
      to: '/warehouse?tab=inbound',
      label: 'Chờ nhập kho',
      icon: PackagePlus,
      count: counts.inbound,
      matchPrefixes: ['/warehouse/receive'],
      groupLabel: 'Vận hành',
    },
    {
      to: '/warehouse?tab=putaway',
      label: 'Chờ xếp vị trí',
      icon: Archive,
      count: counts.putaway,
      matchPrefixes: ['/warehouse/storage'],
    },
    {
      to: '/warehouse/inventory',
      label: 'Tồn kho & vị trí',
      icon: Boxes,
      count: counts.inventory,
      matchPrefixes: ['/warehouse/inventory'],
    },
    {
      to: '/warehouse/areas',
      label: 'Khu vực kho',
      icon: Building2,
      matchPrefixes: ['/warehouse/areas'],
    },
    {
      to: '/warehouse/transactions',
      label: 'Sổ giao dịch',
      icon: ClipboardList,
      matchPrefixes: ['/warehouse/transactions'],
    },
    {
      to: '/warehouse/distributions',
      label: 'Xuất kho từ thiện',
      icon: HandHeart,
      matchPrefixes: ['/warehouse/distributions', '/warehouse/tracking'],
    },
    { to: '/warehouse/processing-operations', label: 'Xuất tái chế / tiêu hủy', icon: Archive, matchPrefixes: ['/warehouse/processing-operations'] },
  ];
  return (
    <OpsLayout homePath="/warehouse" roleLabel="Chuyên viên xuất nhập kho" nav={nav}>
      {children}
    </OpsLayout>
  );
};
export default WarehouseShell;
