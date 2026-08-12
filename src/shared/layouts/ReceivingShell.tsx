import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle, Layers, Users } from 'lucide-react';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';
import { receivingService } from '@/services/receivingService';

/**
 * Receiving console frame. Counts are loaded from the receiving API.
 */
export const ReceivingShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [counts, setCounts] = useState({ receiving: 0, completed: 0, transferring: 0, teams: 0 });

  useEffect(() => {
    const refresh = async () => {
      try {
        const batches = await receivingService.getMyBatches();
        setCounts({
          receiving: batches.filter((b) => b.status === 'Receiving' || b.status === 'Planned')
            .length,
          completed: batches.filter((b) => b.status === 'Completed').length,
          transferring: batches.filter((b) => b.status === 'SentToClassification').length,
          teams: new Set(batches.map((b) => `${b.shiftId}-${b.teamName}`)).size,
        });
      } catch {
        setCounts({ receiving: 0, completed: 0, transferring: 0, teams: 0 });
      }
    };
    refresh();
  }, []);

  const nav: OpsNavItem[] = [
    {
      to: '/receiving',
      label: 'Đang thu nhận',
      icon: Truck,
      count: counts.receiving,
      matchPrefixes: ['/receiving/batch', '/receiving/request'],
    },
    {
      to: '/receiving?tab=completed',
      label: 'Đã gom xong',
      icon: CheckCircle,
      count: counts.completed,
    },
    {
      to: '/receiving?tab=transferring',
      label: 'Đang chuyển đi',
      icon: Layers,
      count: counts.transferring,
    },
    {
      to: '/receiving/team',
      label: 'Nhóm của tôi',
      icon: Users,
      count: counts.teams,
      groupLabel: 'NHÂN SỰ',
    },
  ];

  return (
    <OpsLayout homePath="/receiving" roleLabel="Bộ phận Tiếp nhận" nav={nav}>
      {children}
    </OpsLayout>
  );
};

export default ReceivingShell;
