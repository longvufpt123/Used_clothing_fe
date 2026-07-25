/** Mock DB for ClassificationStaff pipeline */

export type ClassificationBatchStatus = 'PendingConfirmation' | 'PendingClassification' | 'Classified' | 'SendingToWarehouse';

export interface ClassificationItem {
  id: string;
  code: string;
  donorName: string;
  estimatedWeightKg: number;
  estimatedCategory: string;
  status: 'pending' | 'done';
  charityJackets?: number;
  charityTshirts?: number;
  charityPants?: number;
  recycleWeightKg?: number;
  notes?: string;
}

export interface ClassificationBatch {
  id: string;
  code: string;
  sourceRoute: string;
  receivedDate: string;
  status: ClassificationBatchStatus;
  totalWeightKg: number;
  itemCount: number;
  items: ClassificationItem[];
  classifiedAt?: string;
  handoffAt?: string;
}

const STORAGE_KEY = 'classification_batches';

const DEFAULT_BATCHES: ClassificationBatch[] = [
  {
    id: 'cls-batch-1',
    code: 'INTAKE-2026-C',
    sourceRoute: 'Tuyến Thủ Đức - Quận 9 (Kho tập trung)',
    receivedDate: '2026-07-11',
    status: 'PendingConfirmation',
    totalWeightKg: 42.3,
    itemCount: 3,
    items: [
      {
        id: 'item-1',
        code: 'RT-2026-810',
        donorName: 'Phạm Hữu Tài',
        estimatedWeightKg: 12.5,
        estimatedCategory: 'Áo khoác gió & Đồ nỉ',
        status: 'pending',
      },
      {
        id: 'item-2',
        code: 'RT-2026-811',
        donorName: 'Ngô Thị Lan',
        estimatedWeightKg: 7.2,
        estimatedCategory: 'Quần áo trẻ em',
        status: 'pending',
      },
      {
        id: 'item-3',
        code: 'RT-2026-812',
        donorName: 'Đặng Minh Khoa',
        estimatedWeightKg: 22.6,
        estimatedCategory: 'Quần denim / kaki hỗn hợp',
        status: 'pending',
      },
    ],
  },
  {
    id: 'cls-batch-2',
    code: 'INTAKE-2026-B',
    sourceRoute: 'Tuyến Bình Thạnh - Phú Nhuận (Gom bưu cục)',
    receivedDate: '2026-07-12',
    status: 'PendingClassification',
    totalWeightKg: 16.3,
    itemCount: 2,
    items: [
      {
        id: 'item-4',
        code: 'RT-2026-805',
        donorName: 'Lê Văn Tám',
        estimatedWeightKg: 12.5,
        estimatedCategory: 'Đồ ấm / Áo khoác',
        status: 'pending',
      },
      {
        id: 'item-5',
        code: 'RT-2026-806',
        donorName: 'Hoàng Thị Cúc',
        estimatedWeightKg: 3.8,
        estimatedCategory: 'Quần áo trẻ em',
        status: 'pending',
      },
    ],
  },
  {
    id: 'cls-batch-3',
    code: 'INTAKE-2026-A-ARCH',
    sourceRoute: 'Tuyến Quận 1 - Quận 3 (Thu gom nội thành)',
    receivedDate: '2026-07-10',
    status: 'Classified',
    totalWeightKg: 28.0,
    itemCount: 2,
    classifiedAt: '2026-07-11T14:30:00',
    items: [
      {
        id: 'item-6',
        code: 'RT-2026-790',
        donorName: 'Vũ Thanh Hà',
        estimatedWeightKg: 15.0,
        estimatedCategory: 'Áo thun / Sơ mi',
        status: 'done',
        charityJackets: 2,
        charityTshirts: 18,
        charityPants: 6,
        recycleWeightKg: 3.5,
        notes: 'Đã tách từ thiện / tái chế',
      },
      {
        id: 'item-7',
        code: 'RT-2026-791',
        donorName: 'Trịnh Quốc Bảo',
        estimatedWeightKg: 13.0,
        estimatedCategory: 'Hỗn hợp',
        status: 'done',
        charityJackets: 1,
        charityTshirts: 10,
        charityPants: 8,
        recycleWeightKg: 4.2,
      },
    ],
  },
  {
    id: 'cls-batch-4',
    code: 'INTAKE-2026-D',
    sourceRoute: 'Tuyến Quận 7 - Nhà Bè (Thu gom Nam Sài Gòn)',
    receivedDate: '2026-07-15',
    status: 'PendingConfirmation',
    totalWeightKg: 35.5,
    itemCount: 2,
    items: [
      {
        id: 'item-8',
        code: 'RT-2026-820',
        donorName: 'Nguyễn Thị Minh',
        estimatedWeightKg: 15.5,
        estimatedCategory: 'Quần áo hè hỗn hợp',
        status: 'pending',
      },
      {
        id: 'item-9',
        code: 'RT-2026-821',
        donorName: 'Lê Hoàng Nam',
        estimatedWeightKg: 20.0,
        estimatedCategory: 'Áo khoác và đồ denim',
        status: 'pending',
      },
    ],
  },
];

export const initClassificationDb = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BATCHES));
  }
};

export const getClassificationBatches = (): ClassificationBatch[] => {
  initClassificationDb();
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

export const saveClassificationBatches = (batches: ClassificationBatch[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
};

export const getClassificationBatch = (id: string): ClassificationBatch | undefined => {
  return getClassificationBatches().find((b) => b.id === id);
};

export const saveItemClassification = (
  batchId: string,
  itemId: string,
  data: Pick<ClassificationItem, 'charityJackets' | 'charityTshirts' | 'charityPants' | 'recycleWeightKg' | 'notes'>
) => {
  const batches = getClassificationBatches();
  const bIndex = batches.findIndex((b) => b.id === batchId);
  if (bIndex === -1) return false;

  const items = batches[bIndex].items.map((item) =>
    item.id === itemId
      ? { ...item, ...data, status: 'done' as const }
      : item
  );

  const allDone = items.every((i) => i.status === 'done');
  batches[bIndex] = {
    ...batches[bIndex],
    items,
    status: allDone ? 'Classified' : batches[bIndex].status,
    classifiedAt: allDone ? new Date().toISOString() : batches[bIndex].classifiedAt,
  };

  saveClassificationBatches(batches);
  return allDone;
};

export const confirmHandoffToWarehouse = (batchId: string): boolean => {
  const batches = getClassificationBatches();
  const bIndex = batches.findIndex((b) => b.id === batchId);
  if (bIndex === -1) return false;
  if (batches[bIndex].status !== 'Classified') return false;

  batches[bIndex] = {
    ...batches[bIndex],
    status: 'SendingToWarehouse',
    handoffAt: new Date().toISOString(),
  };
  saveClassificationBatches(batches);

  // Push into warehouse inbound queue if warehouse mock exists
  try {
    // Dynamic handoff into warehouse storage
    const warehouseKey = 'warehouse_batches';
    const existing: WarehouseHandoffBatch[] = JSON.parse(localStorage.getItem(warehouseKey) || '[]');
    const batch = batches[bIndex];
    if (!existing.some((w) => w.id === batch.id)) {
      existing.unshift({
        id: batch.id,
        code: batch.code,
        sourceRoute: batch.sourceRoute,
        receivedDate: batch.receivedDate,
        status: 'SendingToWarehouse',
        totalWeightKg: batch.totalWeightKg,
        itemCount: batch.itemCount,
        charitySummary: summarizeCharity(batch.items),
        recycleWeightKg: batch.items.reduce((s, i) => s + (i.recycleWeightKg || 0), 0),
      });
      localStorage.setItem(warehouseKey, JSON.stringify(existing));
    }
  } catch {
    // ignore if warehouse not ready
  }

  return true;
};

export const confirmIntakeBatch = (batchId: string): boolean => {
  const batches = getClassificationBatches();
  const bIndex = batches.findIndex((b) => b.id === batchId);
  if (bIndex === -1) return false;
  if (batches[bIndex].status !== 'PendingConfirmation') return false;

  batches[bIndex] = {
    ...batches[bIndex],
    status: 'PendingClassification',
  };
  saveClassificationBatches(batches);
  return true;
};

function summarizeCharity(items: ClassificationItem[]) {
  return {
    jackets: items.reduce((s, i) => s + (i.charityJackets || 0), 0),
    tshirts: items.reduce((s, i) => s + (i.charityTshirts || 0), 0),
    pants: items.reduce((s, i) => s + (i.charityPants || 0), 0),
  };
}

/** Minimal type for warehouse handoff payload (avoid circular import) */
interface WarehouseHandoffBatch {
  id: string;
  code: string;
  sourceRoute: string;
  receivedDate: string;
  status: string;
  totalWeightKg: number;
  itemCount: number;
  charitySummary: { jackets: number; tshirts: number; pants: number };
  recycleWeightKg: number;
}
