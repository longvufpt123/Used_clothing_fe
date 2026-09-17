import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Layers, CheckCircle, Boxes, Send, PackagePlus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import OpsLayout, { type OpsNavItem } from '@/shared/layouts/OpsLayout';
import { classificationService } from '@/services/classificationService';

import { PENDING_CLASSIFICATION_STATUSES, CLASSIFIED_INTAKE_STATUSES, isOpenClassifiedGroup, isPendingWarehouseGroup, isSentWarehouseGroup, classificationDate } from '@/utils/classificationQueues';

/** Classification console frame: classify → hand off to warehouse. */
export const ClassificationShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [counts, setCounts] = useState({
    unassignedItems: 0,
    pending: 0,
    classified: 0,
    grouped: 0,
    pendingWarehouse: 0,
    sentToWarehouse: 0,
  });

  const selectedDate = new URLSearchParams(location.search).get('date') ?? classificationDate();
  const groupQuery = new URLSearchParams(location.search).has('date')
    ? `?date=${encodeURIComponent(selectedDate)}` : '';
  useEffect(() => {
    let active = true;
    let generation = 0;
    const refresh = async () => {
      const request = ++generation;
      try {
        const [batches, groupedBatches, items, allGroupedBatches] = await Promise.all([
          classificationService.getBatches(),
          classificationService.getGroupedBatches(selectedDate),
          classificationService.getUnassignedItems(),
          classificationService.getGroupedBatches(),
        ]);
        if (!active || request !== generation) return;
        setCounts({
          pending: batches.filter(b => PENDING_CLASSIFICATION_STATUSES.has(b.status)).length,
          classified: batches.filter(b => CLASSIFIED_INTAKE_STATUSES.has(b.status)).length,
          unassignedItems: items.length,
          grouped: allGroupedBatches.filter(isOpenClassifiedGroup).length,
          pendingWarehouse: groupedBatches.filter(isPendingWarehouseGroup).length,
          sentToWarehouse: groupedBatches.filter(isSentWarehouseGroup).length,
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
    window.addEventListener('classification-data-changed', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('classification-data-changed', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [location.pathname, location.search, selectedDate]);

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
      to: '/classification/manual-batching',
      label: 'Chờ gom nhóm',
      icon: PackagePlus,
      count: counts.unassignedItems,
    },
    {
      to: `/classification/groups${groupQuery}`,
      label: 'Khu vực đồ đã phân loại',
      icon: Boxes,
      count: counts.grouped,
      matchPrefixes: ['/classification/groups'],
    },
    {
      to: `/classification/pending-warehouse${groupQuery}`,
      label: 'Chờ kho tiếp nhận',
      icon: Send,
      count: counts.pendingWarehouse,
    },
    {
      to: `/classification/warehouse-handoffs${groupQuery}`,
      label: 'Đã gửi sang khu vực lưu trữ',
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
