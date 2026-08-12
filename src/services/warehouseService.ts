import apiClient from './api';
import type { ClassifiedItem } from './classificationService';

export interface WarehouseDashboard {
  pendingReceipt: number;
  awaitingPutaway: number;
  storedBatches: number;
  availableQuantity: number;
  inventorySkuCount: number;
  availableWeightKg: number;
  capacityUsedPercent: number;
}
export interface WarehouseLocationLayout {
  id: string;
  areaGroupId?: string;
  locationCode: string;
  aisleCode: string;
  rackCode: string;
  shelfCode: string;
  binCode: string;
  preferredGarmentGroup?: string;
  preferredProcessingDirection?: string;
  capacityKg: number;
  currentWeightKg: number;
  status: string;
  inventoryCount: number;
  itemQuantity: number;
}
export interface WarehouseAreaLayout {
  id: string;
  areaName: string;
  description?: string;
  areaType: 'Storage' | 'Receiving' | 'Unclassified' | 'Classified' | string;
  capacityKg: number;
  currentWeightKg: number;
  groups: {
    id: string;
    groupName: string;
    description?: string;
    capacityKg: number;
    currentWeightKg: number;
  }[];
  locations: WarehouseLocationLayout[];
  intakeBatches: {
    id: string;
    batchCode: string;
    status: string;
    totalWeight: number;
    intakeDate: string;
    donationRequests: number;
    teamName?: string;
    groupName?: string;
    warehouseReceivedAt?: string;
    warehouseReceivedBy?: string;
  }[];
}
export interface WarehouseLayout {
  warehouseId: string;
  warehouseName: string;
  address: string;
  capacityKg: number;
  currentWeightKg: number;
  areas: WarehouseAreaLayout[];
}
export interface WarehouseBatch {
  id: string;
  batchCode: string;
  classificationDate: string;
  fabricType: string;
  garmentGroup: string;
  clothingType: string;
  gender: string;
  targetUser: string;
  size: string;
  conditionGrade: 'A' | 'B' | 'C';
  processingDirection: string;
  expectedItemCount: number;
  expectedWeightKg: number;
  status: string;
  sentAt?: string;
  receivedAt?: string;
  receivedWeightKg?: number;
  receivedItemCount?: number;
  receiptNotes?: string;
  donationRequestCodes: string[];
  items: ClassifiedItem[];
}
export interface StorageLocation {
  id: string;
  locationCode: string;
  areaName: string;
  aisleCode: string;
  rackCode: string;
  shelfCode: string;
  binCode: string;
  preferredGarmentGroup?: string;
  preferredProcessingDirection?: string;
  capacityKg: number;
  currentWeightKg: number;
  availableCapacityKg: number;
  status: string;
  matchScore: number;
}
export interface WarehouseInventory {
  id: string;
  sku: string;
  classifiedBatchId: string;
  batchCode: string;
  locationCode: string;
  areaName: string;
  fabricType: string;
  garmentGroup: string;
  clothingType: string;
  gender: string;
  targetUser: string;
  size: string;
  conditionGrade: 'A' | 'B' | 'C';
  processingDirection: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  totalWeightKg: number;
  reservedWeightKg: number;
  availableWeightKg: number;
  status: string;
  storedAt?: string;
  donationRequestCodes: string[];
}
export interface TransactionItem {
  id: string;
  inventoryId: string;
  sku: string;
  classifiedBatchCode?: string;
  quantity: number;
  weightKg: number;
  quantityBefore: number;
  quantityAfter: number;
  weightBefore: number;
  weightAfter: number;
  sourceLocationCode?: string;
  destinationLocationCode?: string;
  notes?: string;
  donationRequestCodes: string[];
}
export interface WarehouseTransaction {
  id: string;
  transactionCode: string;
  transactionType: 'RECEIPT' | 'PUTAWAY' | 'MOVE' | 'OUT' | string;
  referenceType?: string;
  referenceId?: string;
  status: string;
  notes?: string;
  performedAt: string;
  performedBy: string;
  items: TransactionItem[];
}
export interface WarehouseClassifiedBatchTrace {
  id: string;
  batchCode: string;
  status: string;
  clothingType: string;
  conditionGrade: string;
  processingDirection: string;
  itemCount: number;
  weightKg: number;
  inventorySku?: string;
  locationCode?: string;
  donationRequestCodes: string[];
}
export interface WarehouseIntakeTrace {
  id: string;
  batchCode: string;
  intakeDate: string;
  status: string;
  routeName?: string;
  donationRequests: number;
  classifiedItems: number;
  classifiedBatches: WarehouseClassifiedBatchTrace[];
}
export interface ApiClassifiedBatch {
  id: string;
  batchCode: string;
  classificationDate: string;
  fabricType: string;
  garmentGroup: string;
  clothingType: string;
  gender: string;
  targetUser: string;
  size: string;
  conditionGrade: string;
  processingDirection: string;
  totalItem: number;
  status: string;
}
export interface ApiWarehouseArea {
  id: string;
  areaName: string;
  code: string;
  capacity: number;
  occupied: number;
  groupId?: string;
}
export interface ApiAreaGroup {
  id: string;
  name: string;
  code: string;
}
export interface ApiInventory {
  id: string;
  itemCode: string;
  quantity: number;
  areaId: string;
  areaName?: string;
  classifiedItemId?: string;
}
export interface ApiTransferRequest {
  id: string;
  code: string;
  status: string;
  requestDate: string;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  items?: unknown[];
}
export interface ApiDistributionRequest {
  id: string;
  code: string;
  organizationName: string;
  status: string;
  requestDate: string;
  items?: unknown[];
}

export const warehouseService = {
  // Warehouse master data is managed by Manager accounts.
  createWarehouse: (data: {
    warehouseName: string;
    address: string;
    phoneNumber?: string;
    email?: string;
    description?: string;
    totalCapacityKg: number;
  }) => apiClient.post<unknown, { id: string }>('/warehouse-operations/warehouses', data),
  dashboard: (warehouseId?: string) =>
    apiClient.get<unknown, WarehouseDashboard>('/warehouse-operations/dashboard', {
      params: { warehouseId },
    }),
  layout: (warehouseId?: string) =>
    apiClient.get<unknown, WarehouseLayout>('/warehouse-operations/layout', {
      params: { warehouseId },
    }),
  inboundBatches: (warehouseId?: string) =>
    apiClient.get<unknown, WarehouseBatch[]>('/warehouse-operations/inbound-batches', {
      params: { warehouseId },
    }),
  intakeTraces: (warehouseId?: string) =>
    apiClient.get<unknown, WarehouseIntakeTrace[]>('/warehouse-operations/intake-traces', {
      params: { warehouseId },
    }),
  createArea: (data: {
    warehouseId: string;
    areaName: string;
    description?: string;
    capacityKg: number;
  }) => apiClient.post<unknown, { id: string }>('/warehouse-operations/areas', data),
  updateArea: (
    id: string,
    data: { warehouseId: string; areaName: string; description?: string; capacityKg: number },
  ) => apiClient.put(`/warehouse-operations/areas/${id}`, data),
  deleteArea: (id: string) => apiClient.delete(`/warehouse-operations/areas/${id}`),
  createGroup: (data: {
    areaId: string;
    groupName: string;
    description?: string;
    capacityKg: number;
  }) => apiClient.post<unknown, { id: string }>('/warehouse-operations/groups', data),
  updateGroup: (
    id: string,
    data: { areaId: string; groupName: string; description?: string; capacityKg: number },
  ) => apiClient.put(`/warehouse-operations/groups/${id}`, data),
  deleteGroup: (id: string) => apiClient.delete(`/warehouse-operations/groups/${id}`),
  createLocation: (data: {
    areaGroupId: string;
    locationCode: string;
    aisleCode: string;
    rackCode: string;
    shelfCode: string;
    binCode: string;
    preferredGarmentGroup?: string;
    preferredProcessingDirection?: string;
    capacityKg: number;
    status: string;
  }) => apiClient.post<unknown, { id: string }>('/warehouse-operations/locations', data),
  updateLocation: (
    id: string,
    data: {
      areaGroupId: string;
      locationCode: string;
      aisleCode: string;
      rackCode: string;
      shelfCode: string;
      binCode: string;
      preferredGarmentGroup?: string;
      preferredProcessingDirection?: string;
      capacityKg: number;
      status: string;
    },
  ) => apiClient.put(`/warehouse-operations/locations/${id}`, data),
  deleteLocation: (id: string) => apiClient.delete(`/warehouse-operations/locations/${id}`),
  getBatch: (id: string) =>
    apiClient.get<unknown, WarehouseBatch>(`/warehouse-operations/batches/${id}`),
  confirmReceipt: (
    id: string,
    data: {
      actualWeightKg: number;
      actualItemCount: number;
      sealIntact: boolean;
      discrepancyNotes?: string;
    },
  ) => apiClient.post(`/warehouse-operations/batches/${id}/confirm-receipt`, data),
  locations: (id: string) =>
    apiClient.get<unknown, StorageLocation[]>(`/warehouse-operations/batches/${id}/locations`),
  putaway: (id: string, data: { locationId: string; notes?: string }) =>
    apiClient.post(`/warehouse-operations/batches/${id}/putaway`, data),
  inventory: (search?: string, warehouseId?: string) =>
    apiClient.get<unknown, WarehouseInventory[]>('/warehouse-operations/inventory', {
      params: { search, warehouseId },
    }),
  locationInventory: (locationId: string) =>
    apiClient.get<unknown, WarehouseInventory[]>(
      `/warehouse-operations/locations/${locationId}/inventory`,
    ),
  transactions: (type?: string, warehouseId?: string) =>
    apiClient.get<unknown, WarehouseTransaction[]>('/warehouse-operations/transactions', {
      params: { type, warehouseId },
    }),
  issue: (
    id: string,
    data: {
      quantity: number;
      weightKg: number;
      reason: string;
      referenceType?: string;
      referenceId?: string;
      notes?: string;
    },
  ) => apiClient.post(`/warehouse-operations/inventory/${id}/issue`, data),
  move: (id: string, data: { destinationLocationId: string; reason: string; notes?: string }) =>
    apiClient.post(`/warehouse-operations/inventory/${id}/move`, data),
  getClassifiedBatches: () => apiClient.get<unknown, ApiClassifiedBatch[]>('/classified-batches'),
  getGroupedBatches: () =>
    apiClient.get<unknown, ApiClassifiedBatch[]>('/classification-operations/grouped-batches'),
  getGroupedBatchDetail: (id: string) =>
    apiClient.get<unknown, unknown>(`/classification-operations/grouped-batches/${id}`),
  getAreas: () => apiClient.get<unknown, ApiWarehouseArea[]>('/warehouse-areas'),
  getAreaGroups: () => apiClient.get<unknown, ApiAreaGroup[]>('/area-groups'),
  getInventories: () => apiClient.get<unknown, ApiInventory[]>('/inventories'),
  allocateInventory: (payload: { areaId: string; classifiedItemId: string; quantity: number }) =>
    apiClient.post<unknown, ApiInventory>('/inventories', payload),
  getTransferRequests: () => apiClient.get<unknown, ApiTransferRequest[]>('/transfer-requests'),
  createTransferRequest: (payload: unknown) =>
    apiClient.post<unknown, ApiTransferRequest>('/transfer-requests', payload),
  getDistributionRequests: () =>
    apiClient.get<unknown, ApiDistributionRequest[]>('/distribution-requests'),
  updateDistributionStatus: (id: string, status: string) =>
    apiClient.put<unknown, ApiDistributionRequest>(`/distribution-requests/${id}`, { status }),
};

export default warehouseService;
