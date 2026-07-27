import apiClient from './api';

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
  items?: any[];
}

export interface ApiDistributionRequest {
  id: string;
  code: string;
  organizationName: string;
  status: string;
  requestDate: string;
  items?: any[];
}

export const warehouseService = {
  // Classified Batches & Inbound
  getClassifiedBatches: () =>
    apiClient.get<unknown, ApiClassifiedBatch[]>('/classified-batches'),
  
  getGroupedBatches: () =>
    apiClient.get<unknown, ApiClassifiedBatch[]>('/classification-operations/grouped-batches'),

  getGroupedBatchDetail: (id: string) =>
    apiClient.get<unknown, any>(`/classification-operations/grouped-batches/${id}`),

  // Storage & Areas
  getAreas: () =>
    apiClient.get<unknown, ApiWarehouseArea[]>('/warehouse-areas'),

  getAreaGroups: () =>
    apiClient.get<unknown, ApiAreaGroup[]>('/area-groups'),

  getInventories: () =>
    apiClient.get<unknown, ApiInventory[]>('/inventories'),

  allocateInventory: (payload: { areaId: string; classifiedItemId: string; quantity: number }) =>
    apiClient.post<unknown, ApiInventory>('/inventories', payload),

  // Transfer & Distribution
  getTransferRequests: () =>
    apiClient.get<unknown, ApiTransferRequest[]>('/transfer-requests'),

  createTransferRequest: (payload: any) =>
    apiClient.post<unknown, ApiTransferRequest>('/transfer-requests', payload),

  getDistributionRequests: () =>
    apiClient.get<unknown, ApiDistributionRequest[]>('/distribution-requests'),

  updateDistributionStatus: (id: string, status: string) =>
    apiClient.put<unknown, ApiDistributionRequest>(`/distribution-requests/${id}`, { status }),
};

export default warehouseService;
