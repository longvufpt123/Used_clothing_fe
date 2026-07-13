import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PackagePlus, Archive, Truck, MapPin } from 'lucide-react';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';
import { getWarehouseBatches, getDistributions } from '@/utils/warehouseMockDb';

/** Warehouse console frame with a workflow rail: receive → shelve → distribute → track. */
export const WarehouseShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [counts, setCounts] = useState({ inbound: 0, shelving: 0, distribute: 0, tracking: 0 });

  useEffect(() => {
    const refresh = () => {
      const batches = getWarehouseBatches();
      const dists = getDistributions();
      setCounts({
        inbound: batches.filter((b) => b.status === 'SendingToWarehouse').length,
        shelving: batches.filter((b) => b.status === 'WarehouseReceived').length,
        distribute: dists.filter((d) => d.status === 'Pending').length,
        tracking: dists.filter((d) => d.status === 'Shipped' || d.trackingCode).length,
      });
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const nav: OpsNavItem[] = [
    { to: '/warehouse', label: 'Tổng quan', icon: LayoutDashboard },
    {
      to: '/warehouse?tab=inbound',
      label: 'Chờ nhập kho',
      icon: PackagePlus,
      count: counts.inbound,
      matchPrefixes: ['/warehouse/receive'],
      groupLabel: 'Quy trình',
    },
    { to: '/warehouse?tab=shelving', label: 'Xếp kệ tồn kho', icon: Archive, count: counts.shelving, matchPrefixes: ['/warehouse/storage'] },
    { to: '/warehouse?tab=distribute', label: 'Gom & phân phối', icon: Truck, count: counts.distribute, matchPrefixes: ['/warehouse/distribute'] },
    { to: '/warehouse?tab=tracking', label: 'Theo dõi vận đơn', icon: MapPin, count: counts.tracking, matchPrefixes: ['/warehouse/tracking'] },
  ];

  return (
    <OpsLayout homePath="/warehouse" roleLabel="Bộ phận Kho" nav={nav}>
      {children}
    </OpsLayout>
  );
};

export default WarehouseShell;
