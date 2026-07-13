import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle, Layers } from 'lucide-react';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';
import { getBatches } from '@/utils/receivingMockDb';

/**
 * Receiving console frame. Reads the receiving mock DB so the workflow rail
 * shows live batch counts for each stage.
 */
export const ReceivingShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [counts, setCounts] = useState({ receiving: 0, completed: 0, transferring: 0 });

  useEffect(() => {
    const refresh = () => {
      const batches = getBatches();
      setCounts({
        receiving: batches.filter((b) => b.status === 'Receiving').length,
        completed: batches.filter((b) => b.status === 'Completed').length,
        transferring: batches.filter((b) => b.status === 'Transferring').length,
      });
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const nav: OpsNavItem[] = [
    {
      to: '/receiving',
      label: 'Đang thu nhận',
      icon: Truck,
      count: counts.receiving,
      matchPrefixes: ['/receiving/batch', '/receiving/request'],
    },
    { to: '/receiving?tab=completed', label: 'Đã gom xong', icon: CheckCircle, count: counts.completed },
    { to: '/receiving?tab=transferring', label: 'Đang chuyển đi', icon: Layers, count: counts.transferring },
  ];

  return (
    <OpsLayout homePath="/receiving" roleLabel="Bộ phận Tiếp nhận" nav={nav}>
      {children}
    </OpsLayout>
  );
};

export default ReceivingShell;
