import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Layers, CheckCircle, PackageCheck } from 'lucide-react';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';
import { getClassificationBatches } from '@/utils/classificationMockDb';

/** Classification console frame: classify → hand off to warehouse. */
export const ClassificationShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [counts, setCounts] = useState({ pending: 0, classified: 0, sent: 0 });

  useEffect(() => {
    const refresh = () => {
      const batches = getClassificationBatches();
      setCounts({
        pending: batches.filter((b) => b.status === 'PendingClassification').length,
        classified: batches.filter((b) => b.status === 'Classified').length,
        sent: batches.filter((b) => b.status === 'SendingToWarehouse').length,
      });
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const nav: OpsNavItem[] = [
    { to: '/classification', label: 'Tổng quan', icon: LayoutDashboard },
    {
      to: '/classification?tab=pending',
      label: 'Chờ phân loại',
      icon: Layers,
      count: counts.pending,
      matchPrefixes: ['/classification/classify'],
      groupLabel: 'Quy trình',
    },
    { to: '/classification?tab=classified', label: 'Chờ bàn giao', icon: CheckCircle, count: counts.classified, matchPrefixes: ['/classification/handoff'] },
    { to: '/classification?tab=sent', label: 'Đã bàn giao kho', icon: PackageCheck, count: counts.sent },
  ];

  return (
    <OpsLayout homePath="/classification" roleLabel="Bộ phận Phân loại" nav={nav}>
      {children}
    </OpsLayout>
  );
};

export default ClassificationShell;
