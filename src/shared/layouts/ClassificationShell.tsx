import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Layers, CheckCircle, Boxes, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';
import { classificationService } from '@/services/classificationService';

/** Classification console frame: classify → hand off to warehouse. */
export const ClassificationShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [counts, setCounts] = useState({
    pending: 0,
    classified: 0,
    grouped: 0,
    sentToWarehouse: 0,
  });

  useEffect(() => {
    const refresh = async () => {
      try {
        const [batches, groupedBatches] = await Promise.all([
          classificationService.getBatches(),
          classificationService.getGroupedBatches(),
        ]);
        setCounts({
          pending: batches.filter(
            (b) =>
              b.status === 'PendingConfirmation' ||
              b.status === 'AwaitingClassificationCount' ||
              b.status === 'ReadyForClassification' ||
              b.status === 'Classifying',
          ).length,
          classified: groupedBatches.filter(
            (batch) => batch.status === 'Open' && !batch.placedInClassificationAreaAt,
          ).length,
          grouped: groupedBatches.filter(
            (batch) => batch.status === 'Open' && batch.placedInClassificationAreaAt,
          ).length,
          sentToWarehouse: groupedBatches.filter((batch) => batch.status !== 'Open').length,
        });
      } catch {
        /* Keep the last counts during a temporary API failure. */
      }
    };
    refresh();
    const intervalId = window.setInterval(refresh, 10_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [location.pathname, location.search]);

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
    {
      to: '/classification?tab=classified',
      label: 'Đã phân loại',
      icon: CheckCircle,
      count: counts.classified,
      matchPrefixes: ['/classification/batches', '/classification/classified-groups'],
    },
    {
      to: '/classification/groups',
      label: 'Khu vực đồ đã phân loại',
      icon: Boxes,
      count: counts.grouped,
      matchPrefixes: ['/classification/groups'],
    },
    {
      to: '/classification/warehouse-handoffs',
      label: 'Đã gửi sang kho',
      icon: Send,
      count: counts.sentToWarehouse,
    },
  ];

  return (
    <OpsLayout homePath="/classification" roleLabel="Bộ phận Phân loại" nav={nav}>
      {children}
    </OpsLayout>
  );
};

export default ClassificationShell;
