/** Mock DB for WarehouseStaff pipeline */

export type WarehouseBatchStatus =
  | 'SendingToWarehouse'
  | 'WarehouseReceived'
  | 'Stored';

export type DistributionStatus = 'Pending' | 'Prepared' | 'Shipped';

export interface WarehouseBatch {
  id: string;
  code: string;
  sourceRoute: string;
  receivedDate: string;
  status: WarehouseBatchStatus;
  totalWeightKg: number;
  itemCount: number;
  charitySummary: { jackets: number; tshirts: number; pants: number };
  recycleWeightKg: number;
  physicalReceivedAt?: string;
  shelfId?: string;
  shelfLabel?: string;
  storedAt?: string;
}

export interface ShelfSlot {
  id: string;
  label: string;
  zone: string;
  capacityKg: number;
  usedKg: number;
  occupied: boolean;
}

export interface DistributionRequest {
  id: string;
  code: string;
  campaignName: string;
  destination: string;
  contactName: string;
  contactPhone: string;
  itemsNeeded: { label: string; qty: number }[];
  status: DistributionStatus;
  createdAt: string;
  trackingCode?: string;
  ghnStatus?: string;
  preparedAt?: string;
  shippedAt?: string;
  packedItems?: { label: string; qty: number }[];
}

const BATCHES_KEY = 'warehouse_batches';
const SHELVES_KEY = 'warehouse_shelves';
const DIST_KEY = 'warehouse_distributions';
const INVENTORY_KEY = 'warehouse_inventory';

const DEFAULT_BATCHES: WarehouseBatch[] = [
  {
    id: 'wh-batch-1',
    code: 'INTAKE-2026-WH-01',
    sourceRoute: 'Bàn giao từ tổ Phân loại - Ca sáng',
    receivedDate: '2026-07-12',
    status: 'SendingToWarehouse',
    totalWeightKg: 31.4,
    itemCount: 4,
    charitySummary: { jackets: 5, tshirts: 42, pants: 18 },
    recycleWeightKg: 8.6,
  },
  {
    id: 'wh-batch-2',
    code: 'INTAKE-2026-WH-02',
    sourceRoute: 'Bàn giao từ tổ Phân loại - Ca chiều',
    receivedDate: '2026-07-11',
    status: 'WarehouseReceived',
    totalWeightKg: 24.0,
    itemCount: 3,
    charitySummary: { jackets: 3, tshirts: 28, pants: 12 },
    recycleWeightKg: 5.1,
    physicalReceivedAt: '2026-07-11T16:20:00',
  },
  {
    id: 'wh-batch-3',
    code: 'INTAKE-2026-WH-03',
    sourceRoute: 'Tồn kho tuần trước',
    receivedDate: '2026-07-08',
    status: 'Stored',
    totalWeightKg: 40.0,
    itemCount: 5,
    charitySummary: { jackets: 8, tshirts: 60, pants: 24 },
    recycleWeightKg: 10.0,
    physicalReceivedAt: '2026-07-08T10:00:00',
    shelfId: 'shelf-a2',
    shelfLabel: 'A-02 · Từ thiện',
    storedAt: '2026-07-08T11:30:00',
  },
];

const DEFAULT_SHELVES: ShelfSlot[] = [
  { id: 'shelf-a1', label: 'A-01 · Từ thiện', zone: 'Khu A', capacityKg: 80, usedKg: 12, occupied: false },
  { id: 'shelf-a2', label: 'A-02 · Từ thiện', zone: 'Khu A', capacityKg: 80, usedKg: 40, occupied: true },
  { id: 'shelf-a3', label: 'A-03 · Từ thiện', zone: 'Khu A', capacityKg: 80, usedKg: 0, occupied: false },
  { id: 'shelf-b1', label: 'B-01 · Tái chế', zone: 'Khu B', capacityKg: 120, usedKg: 55, occupied: false },
  { id: 'shelf-b2', label: 'B-02 · Tái chế', zone: 'Khu B', capacityKg: 120, usedKg: 0, occupied: false },
  { id: 'shelf-c1', label: 'C-01 · Trẻ em', zone: 'Khu C', capacityKg: 60, usedKg: 8, occupied: false },
];

const DEFAULT_DIST: DistributionRequest[] = [
  {
    id: 'dist-1',
    code: 'DIST-2026-041',
    campaignName: 'Chiến dịch Mùa Đông Ấm - Q. Bình Thạnh',
    destination: 'Trung tâm Bảo trợ Xã hội Bình Thạnh, 45 Nguyễn Xí',
    contactName: 'Chị Lan Anh',
    contactPhone: '0903 441 228',
    itemsNeeded: [
      { label: 'Áo khoác', qty: 20 },
      { label: 'Áo thun', qty: 40 },
      { label: 'Quần dài', qty: 25 },
    ],
    status: 'Pending',
    createdAt: '2026-07-12',
  },
  {
    id: 'dist-2',
    code: 'DIST-2026-038',
    campaignName: 'Gói hỗ trợ học sinh - Thủ Đức',
    destination: 'Trường THCS Long Trường, TP. Thủ Đức',
    contactName: 'Thầy Hùng',
    contactPhone: '0918 552 103',
    itemsNeeded: [
      { label: 'Áo thun trẻ em', qty: 50 },
      { label: 'Quần dài trẻ em', qty: 50 },
    ],
    status: 'Pending',
    createdAt: '2026-07-11',
  },
  {
    id: 'dist-3',
    code: 'DIST-2026-030',
    campaignName: 'Gửi hàng tái chế - Đối tác dệt sợi',
    destination: 'Kho dệt sợi Tân Bình, 12 Cộng Hòa',
    contactName: 'Anh Phong',
    contactPhone: '0977 110 445',
    itemsNeeded: [{ label: 'Vải tái chế (kg)', qty: 30 }],
    status: 'Shipped',
    createdAt: '2026-07-09',
    trackingCode: 'GHN389201774',
    ghnStatus: 'Đang giao',
    preparedAt: '2026-07-09T09:00:00',
    shippedAt: '2026-07-09T11:15:00',
    packedItems: [{ label: 'Vải tái chế (kg)', qty: 30 }],
  },
];

export interface InventoryStock {
  jackets: number;
  tshirts: number;
  pants: number;
  recycleKg: number;
}

const DEFAULT_INVENTORY: InventoryStock = {
  jackets: 48,
  tshirts: 210,
  pants: 96,
  recycleKg: 62.5,
};

export const initWarehouseDb = () => {
  if (!localStorage.getItem(BATCHES_KEY)) {
    localStorage.setItem(BATCHES_KEY, JSON.stringify(DEFAULT_BATCHES));
  }
  if (!localStorage.getItem(SHELVES_KEY)) {
    localStorage.setItem(SHELVES_KEY, JSON.stringify(DEFAULT_SHELVES));
  }
  if (!localStorage.getItem(DIST_KEY)) {
    localStorage.setItem(DIST_KEY, JSON.stringify(DEFAULT_DIST));
  }
  if (!localStorage.getItem(INVENTORY_KEY)) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(DEFAULT_INVENTORY));
  }
};

export const getWarehouseBatches = (): WarehouseBatch[] => {
  initWarehouseDb();
  return JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
};

export const saveWarehouseBatches = (batches: WarehouseBatch[]) => {
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
};

export const getWarehouseBatch = (id: string): WarehouseBatch | undefined => {
  return getWarehouseBatches().find((b) => b.id === id);
};

export const getShelves = (): ShelfSlot[] => {
  initWarehouseDb();
  return JSON.parse(localStorage.getItem(SHELVES_KEY) || '[]');
};

export const saveShelves = (shelves: ShelfSlot[]) => {
  localStorage.setItem(SHELVES_KEY, JSON.stringify(shelves));
};

export const getDistributions = (): DistributionRequest[] => {
  initWarehouseDb();
  return JSON.parse(localStorage.getItem(DIST_KEY) || '[]');
};

export const saveDistributions = (items: DistributionRequest[]) => {
  localStorage.setItem(DIST_KEY, JSON.stringify(items));
};

export const getDistribution = (id: string): DistributionRequest | undefined => {
  return getDistributions().find((d) => d.id === id);
};

export const getInventory = (): InventoryStock => {
  initWarehouseDb();
  return JSON.parse(localStorage.getItem(INVENTORY_KEY) || '{}');
};

export const saveInventory = (inv: InventoryStock) => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
};

export const confirmPhysicalReceive = (batchId: string): boolean => {
  const batches = getWarehouseBatches();
  const idx = batches.findIndex((b) => b.id === batchId);
  if (idx === -1 || batches[idx].status !== 'SendingToWarehouse') return false;

  batches[idx] = {
    ...batches[idx],
    status: 'WarehouseReceived',
    physicalReceivedAt: new Date().toISOString(),
  };
  saveWarehouseBatches(batches);
  return true;
};

export const allocateShelf = (batchId: string, shelfId: string): boolean => {
  const batches = getWarehouseBatches();
  const shelves = getShelves();
  const bIdx = batches.findIndex((b) => b.id === batchId);
  const sIdx = shelves.findIndex((s) => s.id === shelfId);

  if (bIdx === -1 || sIdx === -1) return false;
  if (batches[bIdx].status !== 'WarehouseReceived') return false;

  const batch = batches[bIdx];
  const shelf = shelves[sIdx];
  const free = shelf.capacityKg - shelf.usedKg;
  if (batch.totalWeightKg > free) return false;

  shelves[sIdx] = {
    ...shelf,
    usedKg: shelf.usedKg + batch.totalWeightKg,
    occupied: shelf.usedKg + batch.totalWeightKg >= shelf.capacityKg * 0.95,
  };

  batches[bIdx] = {
    ...batch,
    status: 'Stored',
    shelfId: shelf.id,
    shelfLabel: shelf.label,
    storedAt: new Date().toISOString(),
  };

  const inv = getInventory();
  inv.jackets += batch.charitySummary.jackets;
  inv.tshirts += batch.charitySummary.tshirts;
  inv.pants += batch.charitySummary.pants;
  inv.recycleKg += batch.recycleWeightKg;

  saveShelves(shelves);
  saveWarehouseBatches(batches);
  saveInventory(inv);
  return true;
};

export const confirmDistributionPrep = (
  requestId: string,
  packedItems: { label: string; qty: number }[]
): { ok: boolean; trackingCode?: string } => {
  const list = getDistributions();
  const idx = list.findIndex((d) => d.id === requestId);
  if (idx === -1 || list[idx].status !== 'Pending') return { ok: false };

  const trackingCode = `GHN${Date.now().toString().slice(-9)}`;
  list[idx] = {
    ...list[idx],
    status: 'Prepared',
    packedItems,
    preparedAt: new Date().toISOString(),
    trackingCode,
    ghnStatus: 'Đã tạo vận đơn',
  };

  // Deduct rough inventory
  const inv = getInventory();
  packedItems.forEach((p) => {
    const q = p.qty;
    if (p.label.toLowerCase().includes('khoác')) inv.jackets = Math.max(0, inv.jackets - q);
    else if (p.label.toLowerCase().includes('thun')) inv.tshirts = Math.max(0, inv.tshirts - q);
    else if (p.label.toLowerCase().includes('quần')) inv.pants = Math.max(0, inv.pants - q);
    else if (p.label.toLowerCase().includes('tái chế')) inv.recycleKg = Math.max(0, inv.recycleKg - q);
  });

  saveDistributions(list);
  saveInventory(inv);
  return { ok: true, trackingCode };
};

export const markDistributionShipped = (requestId: string): boolean => {
  const list = getDistributions();
  const idx = list.findIndex((d) => d.id === requestId);
  if (idx === -1) return false;
  list[idx] = {
    ...list[idx],
    status: 'Shipped',
    shippedAt: new Date().toISOString(),
    ghnStatus: 'Đang lấy hàng',
  };
  saveDistributions(list);
  return true;
};

export const getDistributionByTracking = (code: string): DistributionRequest | undefined => {
  return getDistributions().find((d) => d.trackingCode === code);
};
