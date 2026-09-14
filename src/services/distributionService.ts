import apiClient from './api';
export interface CategoryOption {
  id: string;
  code: string;
  name: string;
  parentId?: string | null;
  sortOrder: number;
}
export interface RequestCriteria {
  clothingTypes: CategoryOption[];
  genders: CategoryOption[];
  sizes: CategoryOption[];
  targetUsers: CategoryOption[];
}
export interface CreateCharityRequestPayload {
  warehouseId: string;
  recipientName: string;
  recipientPhone: string;
  toAddress: string;
  notes?: string;
  requestedClothingTypeId?: string | null;
  requestedGenderId?: string | null;
  requestedSizeId?: string | null;
  requestedTargetUserId?: string | null;
  requestedWeightKg: number;
  requestedQuantity?: number | null;
}
export interface DistributionRequest {
  id: string;
  code: string;
  organizationName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseAddress: string;
  warehousePhone?: string;
  recipientName: string;
  recipientPhone: string;
  toAddress: string;
  status: string;
  notes?: string;
  rejectReason?: string;
  requestedAt: string;
  issueSlipCode?: string;
  warehouseIssuedAt?: string;
  issuedBy?: string;
  ghnOrderCode?: string;
  ghnStatus?: string;
  ghnUpdatedAt?: string;
  items: {
    id: string;
    inventoryId: string;
    batchCode: string;
    sku: string;
    clothingType: string;
    fabricType: string;
    gender: string;
    targetUser: string;
    size: string;
    requestedQuantity: number;
    approvedQuantity: number;
    issuedQuantity: number;
    requestedWeight: number;
    issuedWeight: number;
  }[];
  requestedClothingTypeId?: string | null;
  requestedGenderId?: string | null;
  requestedSizeId?: string | null;
  requestedTargetUserId?: string | null;
  requestedWeightKg?: number | null;
  requestedQuantity?: number | null;
  shipmentHistory: { status: string; description?: string; source: string; occurredAt: string }[];
}
export const distributionService = {
  confirmReceipt: (id: string) => apiClient.post(`/distribution-operations/${id}/organization/receive`),
  criteria: () => apiClient.get<unknown, RequestCriteria>('/distribution-operations/request-criteria'),
  warehouses: () =>
    apiClient.get<unknown, { id: string; warehouseName: string; address: string }[]>('/warehouses'),
  create: (body: CreateCharityRequestPayload) => apiClient.post('/distribution-operations', body),
  mine: () => apiClient.get<unknown, DistributionRequest[]>('/distribution-operations/mine'),
  update: (id: string, body: CreateCharityRequestPayload) =>
    apiClient.put(`/distribution-operations/${id}`, body),
  remove: (id: string) => apiClient.delete(`/distribution-operations/${id}`),
  manager: () => apiClient.get<unknown, DistributionRequest[]>('/distribution-operations/manager'),
  approve: (id: string, approved: boolean, notes?: string) =>
    apiClient.patch(`/distribution-operations/${id}/approval`, { approved, notes }),
  warehouse: () =>
    apiClient.get<unknown, DistributionRequest[]>('/distribution-operations/warehouse'),
  issue: (id: string, notes?: string) =>
    apiClient.post(`/distribution-operations/${id}/issue`, { notes }),
  ghn: (id: string, body: unknown) => apiClient.post(`/distribution-operations/${id}/ghn`, body),
  refresh: (id: string) => apiClient.post(`/distribution-operations/${id}/ghn/refresh`),
};
